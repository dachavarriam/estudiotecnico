import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#112233',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#112233',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 5,
  },
  col1: { width: '10%' }, // Qty
  colUnit: { width: '15%' }, // Unit
  col2: { width: '40%' }, // Item
  col3: { width: '35%' }, // Detail
  text: { fontSize: 10 },
  sectionHeader: { fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 5, color: '#444' },
  bold: { fontWeight: 'bold', fontSize: 10 },
  imageContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  imageWrapper: { width: '45%', marginBottom: 10 },
  image: { width: '100%', height: 150, objectFit: 'cover', borderRadius: 4 },
  imageTag: { fontSize: 8, textAlign: 'center', marginTop: 2, color: '#666' },
});

interface StudyData {
    id: string;
    client: string;
    engineer: string;
    date: string;
    materials: { item: string; quantity: number; unit?: string; category?: string; description?: string }[];
    actions: string[];
    comments: string[];
    images?: { url: string; tag: string }[];
}

export const StudyReport = ({ data }: { data: StudyData }) => {
  const equipment = data.materials.filter(m => m.category === 'equipment');
  const supplies = data.materials.filter(m => m.category !== 'equipment');

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
            <Text style={styles.title}>Estudio Técnico</Text>
            <Text style={styles.subtitle}>#{data.id} - {data.date}</Text>
        </View>
        <View>
            <Text style={styles.subtitle}>TAS Honduras</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.section}>
        <Text style={styles.text}>Cliente: {data.client}</Text>
        <Text style={styles.text}>Ingeniero: {data.engineer}</Text>
      </View>

      {/* Materials */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Materiales Requeridos</Text>
        
        {/* Equipment */}
        {equipment.length > 0 && (
            <View>
                <Text style={styles.sectionHeader}>Equipos</Text>
                <View style={styles.row}>
                    <Text style={[styles.col1, styles.bold]}>Cant.</Text>
                    <Text style={[styles.colUnit, styles.bold]}>Unid.</Text>
                    <Text style={[styles.col2, styles.bold]}>Item</Text>
                    <Text style={[styles.col3, styles.bold]}>Detalle</Text>
                </View>
                {equipment.map((m, i) => (
                    <View key={i} style={styles.row}>
                        <Text style={[styles.col1, styles.text]}>{m.quantity}</Text>
                        <Text style={[styles.colUnit, styles.text]}>{m.unit || 'und'}</Text>
                        <Text style={[styles.col2, styles.text]}>{m.item}</Text>
                        <Text style={[styles.col3, styles.text]}>{m.description || '-'}</Text>
                    </View>
                ))}
            </View>
        )}

        {/* Supplies */}
        {supplies.length > 0 && (
            <View>
                <Text style={styles.sectionHeader}>Suministros / Otros</Text>
                <View style={styles.row}>
                    <Text style={[styles.col1, styles.bold]}>Cant.</Text>
                    <Text style={[styles.colUnit, styles.bold]}>Unid.</Text>
                    <Text style={[styles.col2, styles.bold]}>Item</Text>
                    <Text style={[styles.col3, styles.bold]}>Detalle</Text>
                </View>
                {supplies.map((m, i) => (
                    <View key={i} style={styles.row}>
                        <Text style={[styles.col1, styles.text]}>{m.quantity}</Text>
                        <Text style={[styles.colUnit, styles.text]}>{m.unit || 'und'}</Text>
                        <Text style={[styles.col2, styles.text]}>{m.item}</Text>
                        <Text style={[styles.col3, styles.text]}>{m.description || '-'}</Text>
                    </View>
                ))}
            </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones / Instrucciones</Text>
        {data.actions.map((action, i) => (
            <Text key={i} style={[styles.text, { marginBottom: 3 }]}>• {action}</Text>
        ))}
      </View>

      {/* Comments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comentarios y Observaciones</Text>
        {data.comments.map((comment, i) => (
            <Text key={i} style={[styles.text, { marginBottom: 3, fontStyle: 'italic' }]}>"{comment}"</Text>
        ))}
      </View>

      {/* Images */}
      {data.images && data.images.length > 0 && (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidencia Fotográfica</Text>
            <View style={styles.imageContainer}>
                {data.images.map((img, i) => (
                    <View key={i} style={styles.imageWrapper}>
                         {/* Ensure valid URL or placeholder */}
                        <Image src={img.url} style={styles.image} />
                        <Text style={styles.imageTag}>{img.tag}</Text>
                    </View>
                ))}
            </View>
        </View>
      )}
      
      <Text style={{ position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#999' }}>
        Generado automáticamente por Sistema ET - TAS Honduras
      </Text>
    </Page>
  </Document>
)};
