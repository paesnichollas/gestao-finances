import { renderToBuffer } from '@react-pdf/renderer'
import { FinancialReportPdf } from '@/components/reports/financial-report-pdf'
import { getFinancialReportExportReadModel } from '@/lib/data/finance-read-model'
import { createPdfDownloadResponse } from '@/lib/report-export'
import { getServerSession } from '@/lib/session'

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return new Response('Não autorizado', { status: 401 })
  }

  const generatedAt = new Date()
  const report = await getFinancialReportExportReadModel()
  const pdf = await renderToBuffer(FinancialReportPdf({ report, generatedAt }))

  return createPdfDownloadResponse(pdf, generatedAt)
}
