import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts if needed, but we'll use standard Helvetica with different weights
const primaryColor = '#0f172a'; // slate-900
const secondaryColor = '#334155'; // slate-700
const accentColor = '#C33E34'; // TAS Official Red
const lightBg = '#f8fafc'; // slate-50
const borderColor = '#e2e8f0'; // slate-200

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: accentColor,
    paddingBottom: 15,
    marginBottom: 25,
  },
  brandSection: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: primaryColor,
    letterSpacing: 1,
  },
  companySub: {
    fontSize: 10,
    color: accentColor,
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 1.5,
  },
  reportMeta: {
    alignItems: 'flex-end',
  },
  reportTitle: {
    fontSize: 20,
    color: secondaryColor,
    fontWeight: 'bold',
  },
  reportId: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    backgroundColor: lightBg,
    padding: 15,
    borderRadius: 4,
  },
  gridBox: {
    width: '50%',
    marginBottom: 10,
  },
  gridLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 11,
    color: primaryColor,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: primaryColor,
    borderBottomWidth: 1,
    borderBottomColor: borderColor,
    paddingBottom: 5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  text: { 
    fontSize: 10,
    color: secondaryColor,
    lineHeight: 1.5,
  },
  table: {
    width: '100%',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: primaryColor,
    color: '#ffffff',
    padding: 6,
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: borderColor,
    padding: 6,
    fontSize: 9,
    color: secondaryColor,
  },
  tableRowAlt: {
    backgroundColor: '#f1f5f9',
  },
  colQty: { width: '12%', textAlign: 'center' },
  colUnit: { width: '12%', textAlign: 'center' },
  colItem: { width: '36%', paddingRight: 5 },
  colDesc: { width: '40%' },
  
  laborBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: borderColor,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 5,
  },
  laborStat: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: borderColor,
  },
  laborValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: accentColor,
    marginBottom: 2,
  },
  laborLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  imageContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    marginTop: 10 
  },
  imageWrapper: {
    width: '48%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: borderColor,
    padding: 5,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  image: {
    width: '100%',
    height: 180,
    objectFit: 'contain',
    backgroundColor: '#f8fafc',
  },
  imageTag: { 
    fontSize: 9, 
    textAlign: 'center', 
    marginTop: 5, 
    color: primaryColor,
    fontWeight: 'bold'
  },
  footer: { 
    position: 'absolute', 
    bottom: 30, 
    left: 40, 
    right: 40, 
    borderTopWidth: 1,
    borderTopColor: borderColor,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8, 
    color: '#94a3b8',
  },
  bulletList: {
    marginTop: 5,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletPoint: {
    width: 10,
    fontSize: 10,
    color: accentColor,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: secondaryColor,
    lineHeight: 1.4,
  },
  linkText: {
    color: accentColor,
    textDecoration: 'underline',
  }
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
    notes?: string[];
    location?: string;
    contact_info?: string;
    categories?: string[];
    site_observations?: string;
    estimated_hours?: string;
    estimated_engineers?: string;
    estimated_technicians?: string;
    schedule_type?: string;
    visit_date?: string;
    visit_type?: string;
    engineer_plans?: { title: string, url: string }[];
    director_files?: { title: string, url: string }[];
}

const Footer = ({ id }: { id: string }) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>Generado por TAS HUB - Modulo ET</Text>
    <Text style={styles.footerText}>Ref: {id}</Text>
    <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
        `Página ${pageNumber} de ${totalPages}`
      )} />
  </View>
);

export const StudyReport = ({ data }: { data: StudyData }) => {
  const equipment = data.materials.filter(m => m.category === 'equipment');
  const supplies = data.materials.filter(m => m.category !== 'equipment');

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.brandSection}>
            <Text style={styles.companyName}>TAS SA DE CV</Text>
            <Text style={styles.companySub}>Tecnología, Acceso y Seguridad</Text>
        </View>
        <View style={styles.reportMeta}>
            <Text style={styles.reportTitle}>ESTUDIO TÉCNICO</Text>
            <Text style={styles.reportId}>ID: {data.id}</Text>
        </View>
      </View>

      {/* Info Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.gridBox}>
            <Text style={styles.gridLabel}>Cliente</Text>
            <Text style={styles.gridValue}>{data.client}</Text>
        </View>
        <View style={styles.gridBox}>
            <Text style={styles.gridLabel}>Fecha de Estudio</Text>
            <Text style={styles.gridValue}>{data.visit_date ? new Date(data.visit_date).toLocaleDateString() : data.date}</Text>
        </View>
        <View style={styles.gridBox}>
            <Text style={styles.gridLabel}>Ingeniero Asignado</Text>
            <Text style={styles.gridValue}>{data.engineer}</Text>
        </View>
        <View style={styles.gridBox}>
            <Text style={styles.gridLabel}>Ubicación / Sitio</Text>
            <Text style={styles.gridValue}>{data.location || 'No especificada'}</Text>
        </View>
        <View style={styles.gridBox}>
            <Text style={styles.gridLabel}>Contacto Adicional</Text>
            <Text style={styles.gridValue}>{data.contact_info || 'No especificado'}</Text>
        </View>
        <View style={styles.gridBox}>
            <Text style={styles.gridLabel}>Tipo de Visita</Text>
            <Text style={styles.gridValue}>{data.visit_type || 'Visita Técnica'}</Text>
        </View>
        {data.categories && data.categories.length > 0 && (
            <View style={[styles.gridBox, { width: '100%', marginTop: 5 }]}>
                <Text style={styles.gridLabel}>Sistemas / Categorías</Text>
                <Text style={styles.gridValue}>{data.categories.join(' • ')}</Text>
            </View>
        )}
      </View>

      {/* Observaciones de Campo */}
      {data.site_observations && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas de Campo / Observaciones</Text>
          <Text style={styles.text}>{data.site_observations}</Text>
        </View>
      )}

      {/* Materials Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Listado de Equipos y Suministros</Text>
        
        {data.materials.length === 0 ? (
            <Text style={[styles.text, { fontStyle: 'italic', color: '#94a3b8' }]}>No se registraron equipos o suministros.</Text>
        ) : (
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colQty}>CANT.</Text>
                    <Text style={styles.colUnit}>UNIDAD</Text>
                    <Text style={styles.colItem}>ITEM</Text>
                    <Text style={styles.colDesc}>DESCRIPCIÓN</Text>
                </View>
                {data.materials.map((m, i) => (
                    <View key={i} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
                        <Text style={styles.colQty}>{m.quantity}</Text>
                        <Text style={styles.colUnit}>{m.unit || 'und'}</Text>
                        <Text style={[styles.colItem, { fontWeight: 'bold', color: primaryColor }]}>{m.item}</Text>
                        <Text style={styles.colDesc}>{m.description || '-'}</Text>
                    </View>
                ))}
            </View>
        )}
      </View>

      {/* Labor Estimation */}
      {(data.estimated_hours || data.estimated_engineers || data.estimated_technicians || data.schedule_type) && (
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Estimación de Mano de Obra</Text>
          <View style={styles.laborBox}>
              <View style={styles.laborStat}>
                  <Text style={styles.laborValue}>{data.estimated_engineers || '0'}</Text>
                  <Text style={styles.laborLabel}>Ingenieros</Text>
              </View>
              <View style={styles.laborStat}>
                  <Text style={styles.laborValue}>{data.estimated_technicians || '0'}</Text>
                  <Text style={styles.laborLabel}>Técnicos</Text>
              </View>
              <View style={styles.laborStat}>
                  <Text style={styles.laborValue}>{data.estimated_hours || '0'}</Text>
                  <Text style={styles.laborLabel}>Horas</Text>
              </View>
              <View style={[styles.laborStat, { borderRightWidth: 0, flex: 1.5 }]}>
                  <Text style={[styles.laborValue, { fontSize: 11, marginTop: 4, color: secondaryColor }]}>{data.schedule_type || 'No definido'}</Text>
                  <Text style={styles.laborLabel}>Horario Especial</Text>
              </View>
          </View>
        </View>
      )}

      {/* Actions */}
      {data.actions && data.actions.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Acciones Realizadas / Recomendadas</Text>
            <View style={styles.bulletList}>
                {data.actions.map((action, i) => (
                    <View key={i} style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>{action}</Text>
                    </View>
                ))}
            </View>
          </View>
      )}

      {/* Comments */}
      {data.comments && data.comments.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Comentarios Adicionales</Text>
            <View style={styles.bulletList}>
                {data.comments.map((comment, i) => (
                    <View key={i} style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={[styles.bulletText, { fontStyle: 'italic' }]}>"{comment}"</Text>
                    </View>
                ))}
            </View>
          </View>
      )}

      {/* Other Documents Section (if any) */}
      {(data.engineer_plans?.length || data.director_files?.length) ? (
          <View style={[styles.section, { marginTop: 15 }]} wrap={false}>
            <Text style={styles.sectionTitle}>Documentos y Planos Adjuntos</Text>
            <View style={styles.bulletList}>
                {data.engineer_plans?.map((p, i) => (
                    <View key={`eng-${i}`} style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>Plano/Doc Técnico: <Text style={styles.linkText}>{p.title}</Text></Text>
                    </View>
                ))}
                {data.director_files?.map((p, i) => (
                    <View key={`dir-${i}`} style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>Ref. Administrativa: <Text style={styles.linkText}>{p.title}</Text></Text>
                    </View>
                ))}
            </View>
            <Text style={[styles.text, { fontSize: 8, marginTop: 5, color: '#94a3b8' }]}>
                * Los enlaces a documentos adjuntos están disponibles en la plataforma digital.
            </Text>
          </View>
      ) : null}

      {/* Audio Transcriptions Annex */}
      {data.notes && data.notes.length > 0 && (
          <View style={[styles.section, { marginTop: 15 }]} wrap={false}>
            <Text style={styles.sectionTitle}>Anexo: Transcripciones de Audio</Text>
            <View style={styles.bulletList}>
                {data.notes.map((note, i) => (
                    <View key={i} style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={[styles.bulletText, { fontStyle: 'italic', color: '#475569' }]}>"{note}"</Text>
                    </View>
                ))}
            </View>
          </View>
      )}

      <Footer id={data.id} />
    </Page>

    {/* Images Appendix Page(s) */}
    {data.images && data.images.length > 0 && (
        <Page size="A4" style={[styles.page, { paddingTop: 40 }]}>
            <View style={{ borderBottomWidth: 1, borderBottomColor: borderColor, paddingBottom: 10, marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: primaryColor }}>Anexo: Evidencia Fotográfica</Text>
                <Text style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>Estudio ID: {data.id}</Text>
            </View>
            
            <View style={styles.imageContainer}>
                {data.images.map((img, i) => (
                    <View key={i} style={styles.imageWrapper} wrap={false}>
                        <Image src={img.url} style={styles.image} />
                        <Text style={styles.imageTag}>{img.tag || `Fotografía ${i + 1}`}</Text>
                    </View>
                ))}
            </View>
            
            <Footer id={data.id} />
        </Page>
    )}
  </Document>
)};
