export function exportToPDF(data: any[], title: string) {
  // Simple PDF export using browser print
  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; color: #3b82f6; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
        th { background-color: #3b82f6; color: white; }
        tr:nth-child(even) { background-color: #f9fafb; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <table>
        <thead>
          <tr>
            ${Object.keys(data[0] || {})
              .map((key) => `<th>${key}</th>`)
              .join("")}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row) => `
            <tr>
              ${Object.values(row)
                .map((val) => `<td>${val}</td>`)
                .join("")}
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.print()
}

export function exportToExcel(data: any[], filename: string) {
  // Convert to CSV format (Excel can open CSV files)
  const csv = convertToCSV(data)
  downloadFile(csv, `${filename}.csv`, "text/csv")
}

export function exportToCSV(data: any[], filename: string) {
  const csv = convertToCSV(data)
  downloadFile(csv, `${filename}.csv`, "text/csv")
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ""

  const headers = Object.keys(data[0])
  const rows = data.map((row) =>
    Object.values(row)
      .map((val) => `"${val}"`)
      .join(","),
  )

  return [headers.join(","), ...rows].join("\n")
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob(["\ufeff" + content], { type: `${mimeType};charset=utf-8;` })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
