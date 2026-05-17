import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Constantes de estilo ─────────────────────────────────────────────────────
const BRAND_COLOR: [number, number, number] = [79, 70, 229]; // índigo
const LIGHT_GRAY: [number, number, number] = [245, 245, 245];
const TEXT_DARK: [number, number, number] = [30, 30, 30];
const TEXT_MUTED: [number, number, number] = [120, 120, 120];

const MARGIN = 14;

/**
 * Dibuja el encabezado institucional común a ambos PDF.
 * Devuelve la coordenada Y donde termina el header para que el contenido
 * empiece desde ahí.
 */
function drawHeader(doc: jsPDF, title: string, subtitle?: string): number {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Banda de color superior
    doc.setFillColor(...BRAND_COLOR);
    doc.rect(0, 0, pageWidth, 28, "F");

    // Título dentro de la banda
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(title, MARGIN, 12);

    // Subtítulo / descripción
    if (subtitle) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(subtitle, MARGIN, 21);
    }

    // Fecha de generación (derecha)
    const dateStr = `Generado: ${new Date().toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    })}`;
    doc.setFontSize(8);
    doc.text(dateStr, pageWidth - MARGIN, 21, { align: "right" });

    // Línea separadora bajo el header
    doc.setDrawColor(...BRAND_COLOR);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, 31, pageWidth - MARGIN, 31);

    // Resetear color de texto para el cuerpo
    doc.setTextColor(...TEXT_DARK);

    return 38; // Y de inicio del contenido
}

// ─── Etiquetas en español para las columnas de la tabla de notas ──────────────
const GRADE_COL_LABELS: Record<string, string> = {
    final_score: "Nota Final",
    student_code: "Código Estudiante",
    observations: "Observaciones",
    is_locked: "Estado",
};

// ─── Etiquetas en español para las columnas del detalle ──────────────────────
const DETAIL_COL_LABELS: Record<string, string> = {
    score: "Puntaje",
    name: "Escala",
    criterion_name: "Criterio",
    criterion_description: "Descripción del Criterio",
    comment: "Comentario",
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * PDF TIPO 1 — Tabla de notas del grupo (docente).
 *
 * @param groupLabel  Nombre/descripción del grupo o evaluación (para el título).
 * @param columns     Las mismas columnas que usa GenericTable (ej. COLUMNS de Grades.tsx).
 * @param tableData   El array `tableData` que ya está preparado en la página.
 */
export const exportGroupGradesPDF = (
    groupLabel: string,
    columns: string[],
    tableData: Record<string, any>[]
): void => {
    const doc = new jsPDF();

    const startY = drawHeader(
        doc,
        "Reporte de Notas",
        `Grupo / Evaluación: ${groupLabel}`
    );

    // Cabecera de la tabla — usa etiquetas en español cuando existen
    const head = [columns.map((col) => GRADE_COL_LABELS[col] ?? col)];

    // Filas de la tabla — extrae los valores en el orden de las columnas
    const body = tableData.map((row) =>
        columns.map((col) => {
            const value = row[col];
            return value !== undefined && value !== null ? String(value) : "—";
        })
    );

    autoTable(doc, {
        startY,
        head,
        body,
        theme: "striped",
        styles: {
            fontSize: 9,
            cellPadding: 4,
            textColor: TEXT_DARK,
        },
        headStyles: {
            fillColor: BRAND_COLOR,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "left",
        },
        alternateRowStyles: {
            fillColor: LIGHT_GRAY,
        },
        columnStyles: {
            // La primera columna (nota final) centrada
            0: { halign: "center", fontStyle: "bold" },
        },
        didDrawPage: (data) => {
            // Pie de página con número
            const pageCount = (doc as any).internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(...TEXT_MUTED);
            doc.text(
                `Página ${data.pageNumber} de ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 8,
                { align: "center" }
            );
        },
    });

    const fileName = `Notas_${groupLabel.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    doc.save(fileName);
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * PDF TIPO 2 — Detalle de nota de un estudiante (ficha legible).
 *
 * Cada detalle se renderiza como un bloque con título y párrafo,
 * más una línea de separación entre ítems.
 *
 * @param studentCode  Código o identificador del estudiante.
 * @param finalScore   Nota final numérica.
 * @param observations Observaciones del docente (opcional).
 * @param columns      Las mismas columnas que usa GenericTable en GradeDetail.tsx.
 * @param tableData    El array `tableData` ya preparado en la página.
 */
export const exportStudentDetailPDF = (
    studentCode: string,
    finalScore: number | undefined,
    observations: string | undefined,
    columns: string[],
    tableData: Record<string, any>[]
): void => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - MARGIN * 2;

    let y = drawHeader(
        doc,
        "Reporte de Desempeño",
        `Estudiante: ${studentCode}`
    );

    // ── Resumen rápido (nota final + observaciones) ──────────────────────────
    doc.setFillColor(...LIGHT_GRAY);
    doc.roundedRect(MARGIN, y, contentWidth, 22, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_DARK);
    doc.text("Nota Final:", MARGIN + 4, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...BRAND_COLOR);
    doc.text(finalScore !== undefined ? String(finalScore) : "—", MARGIN + 32, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_DARK);
    const obsText = observations && observations !== "Sin observaciones"
        ? observations
        : "Sin observaciones.";
    doc.text(`Observaciones: ${obsText}`, MARGIN + 4, y + 17, {
        maxWidth: contentWidth - 8,
    });

    y += 30;

    // ── Detalle por criterio ─────────────────────────────────────────────────
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_COLOR);
    doc.text("Desglose por Criterio", MARGIN, y);
    y += 6;

    doc.setDrawColor(...BRAND_COLOR);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, y, pageWidth - MARGIN, y);
    y += 6;

    tableData.forEach((row, index) => {
        // Estima la altura del bloque para paginar si hace falta
        const blockHeight = columns.length * 10 + 10;
        if (y + blockHeight > pageHeight - 16) {
            doc.addPage();
            y = 20;
        }

        // Número de ítem
        doc.setFillColor(...BRAND_COLOR);
        doc.circle(MARGIN + 3, y + 1, 3, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text(String(index + 1), MARGIN + 3, y + 1.8, { align: "center" });

        y += 2;

        // Cada campo del detalle como título + valor
        columns.forEach((col) => {
            const label = DETAIL_COL_LABELS[col] ?? col;
            const value = row[col] !== undefined && row[col] !== null ? String(row[col]) : "—";

            // Etiqueta en negrita
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(...TEXT_DARK);
            doc.text(`${label}:`, MARGIN + 8, y);

            // Valor en normal, con posible wrap
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(60, 60, 60);

            const lines = doc.splitTextToSize(value, contentWidth - 55);
            doc.text(lines, MARGIN + 55, y);

            y += lines.length > 1 ? lines.length * 5 + 2 : 7;
        });

        // Línea separadora entre ítems (salvo el último)
        if (index < tableData.length - 1) {
            y += 2;
            doc.setDrawColor(210, 210, 210);
            doc.setLineWidth(0.3);
            doc.line(MARGIN + 8, y, pageWidth - MARGIN, y);
            y += 6;
        }
    });

    // ── Pie de página ─────────────────────────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...TEXT_MUTED);
        doc.text(
            `Página ${i} de ${totalPages}`,
            pageWidth / 2,
            pageHeight - 8,
            { align: "center" }
        );
    }

    const fileName = `Detalle_Nota_${studentCode.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    doc.save(fileName);
};
