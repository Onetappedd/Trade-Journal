"use client"
import { Document, Page, Text, StyleSheet } from '@react-pdf/renderer'
// @react-pdf/renderer should be in your deps for this to work!

const styles = StyleSheet.create({
  page: { padding: 24 },
  h1: { fontSize: 22, marginBottom: 8 },
  h2: { fontSize: 16, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 12 },
  box: { border: '1 solid #888', borderRadius: 4, marginBottom: 8, padding: 10 },
  code: { fontSize: 10, backgroundColor: '#efefef', borderRadius: 4, padding: 4 }
})

export function AnalyticsReportPDF({ data }: { data: any }) {
  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.h1}>Trading Analytics Report</Text>
        <Text>KPIs / Cards</Text>
        <Text style={styles.box}><Text style={styles.code}>{JSON.stringify(data.cards, null, 2)}</Text></Text>
        <Text style={styles.h2}>Equity Curve</Text>
        <Text style={styles.box}><Text style={styles.code}>{JSON.stringify(data.equity, null, 2)}</Text></Text>
        <Text style={styles.h2}>Monthly PnL</Text>
        <Text style={styles.box}><Text style={styles.code}>{JSON.stringify(data.monthly, null, 2)}</Text></Text>
        <Text style={styles.h2}>Top Symbols/Tags</Text>
        <Text style={styles.box}><Text style={styles.code}>{JSON.stringify(data.top_symbols, null, 2)}</Text></Text>
      </Page>
    </Document>
  )
}
