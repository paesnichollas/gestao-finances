import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { formatBRL, formatDateBR } from '@/lib/calculations'
import {
  buildPartnerReportSections,
  getPartnerSettlementContext,
  type FinancialReportSnapshot,
} from '@/lib/report-export'
import { expenseCategoryOptions, revenueCategoryOptions } from '@/lib/validations'

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 42,
    paddingHorizontal: 36,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#1f2937',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 12,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#172554',
  },
  generatedAt: {
    color: '#64748b',
    textAlign: 'right',
    lineHeight: 1.5,
  },
  metrics: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 18,
  },
  settlementNotice: {
    borderWidth: 1,
    borderColor: '#fdba74',
    borderRadius: 5,
    backgroundColor: '#fff7ed',
    padding: 10,
    marginBottom: 18,
  },
  settlementNoticeTitle: {
    fontFamily: 'Helvetica-Bold',
    color: '#9a3412',
    marginBottom: 3,
  },
  settlementNoticeText: {
    color: '#7c2d12',
    lineHeight: 1.4,
  },
  metric: {
    flexGrow: 1,
    flexBasis: 0,
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#f8fafc',
  },
  metricLabel: {
    color: '#64748b',
    textTransform: 'uppercase',
    fontSize: 7,
    marginBottom: 5,
  },
  metricValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
  },
  revenue: { color: '#15803d' },
  expense: { color: '#dc2626' },
  primary: { color: '#1d4ed8' },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#172554',
    marginBottom: 8,
  },
  columns: {
    flexDirection: 'row',
    gap: 18,
  },
  column: {
    flexGrow: 1,
    flexBasis: 0,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
    paddingVertical: 6,
  },
  tableHeaderText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: '#1e3a8a',
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 5,
    minHeight: 20,
    alignItems: 'center',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  cell: {
    paddingHorizontal: 6,
    lineHeight: 1.35,
  },
  amount: {
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
  },
  empty: {
    color: '#64748b',
    fontStyle: 'italic',
    padding: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 17,
    left: 36,
    right: 36,
    color: '#94a3b8',
    fontSize: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

const revenueCategoryLabel = (category: string) =>
  revenueCategoryOptions.find((option) => option.value === category)?.label ?? category

const expenseCategoryLabel = (category: string) =>
  expenseCategoryOptions.find((option) => option.value === category)?.label ?? category

function ReportHeader({ generatedAt, ledgerTitle }: { generatedAt: Date; ledgerTitle?: string }) {
  return (
    <View style={styles.header} fixed={Boolean(ledgerTitle)}>
      <View>
        <Text style={styles.eyebrow}>Gestão financeira</Text>
        <Text style={styles.title}>{ledgerTitle ?? 'Relatório financeiro'}</Text>
      </View>
      <Text style={styles.generatedAt}>Emitido em {generatedAt.toLocaleString('pt-BR')}</Text>
    </View>
  )
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>Gestão financeira · Relatório confidencial</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  )
}

function TableHeader({ children, fixed = false }: { children: React.ReactNode; fixed?: boolean }) {
  return <View style={styles.tableHeader} fixed={fixed}>{children}</View>
}

type NonArray<T> = T extends readonly unknown[] ? never : T
type PdfTextStyle = NonArray<NonNullable<React.ComponentProps<typeof View>['style']>>
type PdfTextStyleInput = PdfTextStyle | PdfTextStyle[]

function TableCell({ children, style, amount = false }: {
  children: React.ReactNode
  style?: PdfTextStyleInput
  amount?: boolean
}) {
  const customStyles = style ? (Array.isArray(style) ? style : [style]) : []
  const cellStyle = amount
    ? [styles.cell, ...customStyles, styles.amount]
    : [styles.cell, ...customStyles]

  return <Text style={cellStyle}>{children}</Text>
}

function CategoryTable({
  title,
  values,
  label,
  amountStyle,
}: {
  title: string
  values: Record<string, string>
  label: (category: string) => string
  amountStyle: PdfTextStyle
}) {
  const rows = Object.entries(values).sort(([a], [b]) => label(a).localeCompare(label(b), 'pt-BR'))

  return (
    <View style={styles.column}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.table}>
        <TableHeader>
          <TableCell style={{ width: '68%' }}>Categoria</TableCell>
          <TableCell style={{ width: '32%', textAlign: 'right' }}>Valor</TableCell>
        </TableHeader>
        {rows.length === 0 ? (
          <Text style={styles.empty}>Nenhum lançamento registrado.</Text>
        ) : rows.map(([category, value], index) => (
          <View key={category} style={index === rows.length - 1 ? [styles.tableRow, styles.tableRowLast] : styles.tableRow}>
            <TableCell style={{ width: '68%' }}>{label(category)}</TableCell>
            <TableCell style={[{ width: '32%' }, amountStyle]} amount>{formatBRL(value)}</TableCell>
          </View>
        ))}
      </View>
    </View>
  )
}

function PartnerReceiptsTable({
  rows,
  resultLabel,
  amountStyle,
}: {
  rows: ReturnType<typeof buildPartnerReportSections>['receipts']
  resultLabel: string
  amountStyle: PdfTextStyle
}) {
  return (
    <View style={styles.column}>
      <Text style={styles.sectionTitle}>Participação no resultado por sócio</Text>
      <View style={styles.table}>
        <TableHeader>
          <TableCell style={{ width: '46%' }}>Sócio</TableCell>
          <TableCell style={{ width: '20%', textAlign: 'right' }}>%</TableCell>
          <TableCell style={{ width: '34%', textAlign: 'right' }}>{resultLabel}</TableCell>
        </TableHeader>
        {rows.length === 0 ? (
          <Text style={styles.empty}>Não há sócios ativos para apuração.</Text>
        ) : rows.map((partner, index) => (
          <View key={partner.partnerId} style={index === rows.length - 1 ? [styles.tableRow, styles.tableRowLast] : styles.tableRow}>
            <TableCell style={{ width: '46%' }}>{partner.partnerName}</TableCell>
            <TableCell style={{ width: '20%', textAlign: 'right' }}>{partner.percentage}%</TableCell>
            <TableCell style={[{ width: '34%' }, amountStyle]} amount>{formatBRL(partner.amount)}</TableCell>
          </View>
        ))}
      </View>
    </View>
  )
}

function PartnerExpensesTable({
  rows,
}: {
  rows: ReturnType<typeof buildPartnerReportSections>['expenses']
}) {
  return (
    <View style={styles.column}>
      <Text style={styles.sectionTitle}>Despesas adiantadas por sócio</Text>
      <View style={styles.table}>
        <TableHeader>
          <TableCell style={{ width: '66%' }}>Sócio</TableCell>
          <TableCell style={{ width: '34%', textAlign: 'right' }}>Valor adiantado</TableCell>
        </TableHeader>
        {rows.length === 0 ? (
          <Text style={styles.empty}>Nenhuma despesa paga por sócio.</Text>
        ) : rows.map((partner, index) => (
          <View key={partner.partnerId} style={index === rows.length - 1 ? [styles.tableRow, styles.tableRowLast] : styles.tableRow}>
            <TableCell style={{ width: '66%' }}>{partner.partnerName}</TableCell>
            <TableCell style={[{ width: '34%' }, styles.expense]} amount>{formatBRL(partner.amount)}</TableCell>
          </View>
        ))}
      </View>
    </View>
  )
}

export function FinancialReportPdf({ report, generatedAt }: { report: FinancialReportSnapshot; generatedAt: Date }): React.ReactElement<React.ComponentProps<typeof Document>> {
  const partnerSections = buildPartnerReportSections(report)
  const settlementContext = getPartnerSettlementContext(report.netProfit)

  return (
    <Document title="Relatório financeiro" author="Gestão financeira" subject="Consolidado financeiro do projeto">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <ReportHeader generatedAt={generatedAt} />

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Receita total</Text>
            <Text style={[styles.metricValue, styles.revenue]}>{formatBRL(report.totalRevenue)}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Despesa total</Text>
            <Text style={[styles.metricValue, styles.expense]}>{formatBRL(report.totalExpense)}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Lucro líquido</Text>
            <Text style={[styles.metricValue, styles.primary]}>{formatBRL(report.netProfit)}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Sócios ativos</Text>
            <Text style={styles.metricValue}>{report.partnersCount}</Text>
          </View>
        </View>

        {settlementContext.notice ? (
          <View style={styles.settlementNotice}>
            <Text style={styles.settlementNoticeTitle}>Projeto em prejuízo</Text>
            <Text style={styles.settlementNoticeText}>{settlementContext.notice}</Text>
          </View>
        ) : null}

        <View style={styles.columns} wrap={false}>
          <PartnerReceiptsTable
            rows={partnerSections.receipts}
            resultLabel={settlementContext.resultLabel}
            amountStyle={settlementContext.notice ? styles.expense : styles.primary}
          />
          <PartnerExpensesTable rows={partnerSections.expenses} />
        </View>

        <Footer />
      </Page>

      <Page size="A4" orientation="landscape" style={styles.page}>
        <ReportHeader generatedAt={generatedAt} ledgerTitle="Composição financeira" />
        <View style={styles.section}>
          <View style={styles.columns} wrap={false}>
            <CategoryTable title="Receitas por categoria" values={report.revenuesByCategory} label={revenueCategoryLabel} amountStyle={styles.revenue} />
            <CategoryTable title="Despesas por categoria" values={report.expensesByCategory} label={expenseCategoryLabel} amountStyle={styles.expense} />
          </View>
        </View>

        <Footer />
      </Page>

      <Page size="A4" orientation="landscape" style={styles.page}>
        <ReportHeader generatedAt={generatedAt} ledgerTitle="Extrato completo de receitas" />
        <View style={styles.table}>
          <TableHeader fixed>
            <TableCell style={{ width: '15%' }}>Data</TableCell>
            <TableCell style={{ width: '43%' }}>Descrição</TableCell>
            <TableCell style={{ width: '22%' }}>Categoria</TableCell>
            <TableCell style={{ width: '20%', textAlign: 'right' }}>Valor</TableCell>
          </TableHeader>
          {report.revenues.length === 0 ? (
            <Text style={styles.empty}>Nenhuma receita registrada.</Text>
          ) : report.revenues.map((revenue, index) => (
            <View key={revenue.id} style={index === report.revenues.length - 1 ? [styles.tableRow, styles.tableRowLast] : styles.tableRow} wrap={false}>
              <TableCell style={{ width: '15%' }}>{formatDateBR(revenue.date)}</TableCell>
              <TableCell style={{ width: '43%' }}>{revenue.description}</TableCell>
              <TableCell style={{ width: '22%' }}>{revenueCategoryLabel(revenue.category)}</TableCell>
              <TableCell style={[{ width: '20%' }, styles.revenue]} amount>{formatBRL(revenue.amount)}</TableCell>
            </View>
          ))}
        </View>
        <Footer />
      </Page>

      <Page size="A4" orientation="landscape" style={styles.page}>
        <ReportHeader generatedAt={generatedAt} ledgerTitle="Apuração final por sócio" />
        <View style={styles.table}>
          <TableHeader>
            <TableCell style={{ width: '24%' }}>Sócio</TableCell>
            <TableCell style={{ width: '10%', textAlign: 'right' }}>%</TableCell>
            <TableCell style={{ width: '22%', textAlign: 'right' }}>{settlementContext.resultLabel}</TableCell>
            <TableCell style={{ width: '20%', textAlign: 'right' }}>Despesas adiantadas</TableCell>
            <TableCell style={{ width: '24%', textAlign: 'right' }}>{settlementContext.reimbursementLabel}</TableCell>
          </TableHeader>
          {report.partnerSummaries.length === 0 ? (
            <Text style={styles.empty}>Não há sócios ativos para apuração.</Text>
          ) : report.partnerSummaries.map((summary, index) => (
            <View key={summary.partnerId} style={index === report.partnerSummaries.length - 1 ? [styles.tableRow, styles.tableRowLast] : styles.tableRow}>
              <TableCell style={{ width: '24%' }}>{summary.partnerName}</TableCell>
              <TableCell style={{ width: '10%', textAlign: 'right' }}>{summary.percentage}%</TableCell>
              <TableCell style={[{ width: '22%' }, settlementContext.notice ? styles.expense : styles.primary]} amount>{formatBRL(summary.profitShare)}</TableCell>
              <TableCell style={[{ width: '20%' }, styles.expense]} amount>{formatBRL(summary.reimbursableExpense)}</TableCell>
              <TableCell style={[{ width: '24%' }, styles.primary]} amount>{formatBRL(summary.finalAmount)}</TableCell>
            </View>
          ))}
        </View>
        <Footer />
      </Page>

      <Page size="A4" orientation="landscape" style={styles.page}>
        <ReportHeader generatedAt={generatedAt} ledgerTitle="Extrato completo de despesas" />
        <View style={styles.table}>
          <TableHeader fixed>
            <TableCell style={{ width: '12%' }}>Data</TableCell>
            <TableCell style={{ width: '29%' }}>Descrição</TableCell>
            <TableCell style={{ width: '18%' }}>Categoria</TableCell>
            <TableCell style={{ width: '26%' }}>Pagadores</TableCell>
            <TableCell style={{ width: '15%', textAlign: 'right' }}>Valor</TableCell>
          </TableHeader>
          {report.expenses.length === 0 ? (
            <Text style={styles.empty}>Nenhuma despesa registrada.</Text>
          ) : report.expenses.map((expense, index) => (
            <View key={expense.id} style={index === report.expenses.length - 1 ? [styles.tableRow, styles.tableRowLast] : styles.tableRow} wrap={false}>
              <TableCell style={{ width: '12%' }}>{formatDateBR(expense.date)}</TableCell>
              <TableCell style={{ width: '29%' }}>{expense.description}</TableCell>
              <TableCell style={{ width: '18%' }}>{expenseCategoryLabel(expense.category)}</TableCell>
              <TableCell style={{ width: '26%' }}>
                {expense.payments.length === 0
                  ? 'Sem pagador informado'
                  : expense.payments.map((payment) => `${payment.partner.name}: ${formatBRL(payment.amountPaid)}`).join(' · ')}
              </TableCell>
              <TableCell style={[{ width: '15%' }, styles.expense]} amount>{formatBRL(expense.totalAmount)}</TableCell>
            </View>
          ))}
        </View>
        <Footer />
      </Page>
    </Document>
  )
}
