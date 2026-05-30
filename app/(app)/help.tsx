import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { C } from '@/lib/theme'

interface Section {
  id: string
  icon: string
  title: string
  items: { cmd?: string; desc: string; tip?: string }[]
}

const SECTIONS: Section[] = [
  {
    id: 'start',
    icon: 'rocket-outline',
    title: 'Primeros pasos',
    items: [
      { cmd: 'Hey Aria / Oye Aria / Hola Aria', desc: 'Activa el asistente de voz', tip: 'Funciona aunque la pantalla esté apagada si "Escuchar siempre" está activo' },
      { cmd: 'gracias / adiós / chao', desc: 'Cierra la conversación activa y vuelve a esperar' },
      { desc: 'Después de responder, Aria escucha 8 segundos tu siguiente pregunta sin repetir el wake word', tip: 'Conversación continua automática' },
      { desc: 'Activa los permisos en Ajustes → Control del dispositivo para todas las funciones' },
    ],
  },
  {
    id: 'voice',
    icon: 'mic-outline',
    title: 'Conversación y preguntas',
    items: [
      { cmd: '¿Qué puedes hacer?', desc: 'Aria te explica todas sus capacidades' },
      { cmd: '¿Cómo está el clima en [ciudad]?', desc: 'Clima actual en tiempo real' },
      { cmd: 'Busca [tema] en internet', desc: 'Búsqueda web con resultados actualizados' },
      { cmd: 'Ayúdame a escribir un correo sobre [tema]', desc: 'Redacción asistida' },
      { cmd: 'Recomiéndame [cosa] para [contexto]', desc: 'Recomendaciones personalizadas' },
      { cmd: '¿Qué hora es? / ¿Qué día es hoy?', desc: 'Fecha y hora actual' },
    ],
  },
  {
    id: 'device',
    icon: 'phone-portrait-outline',
    title: 'Control del dispositivo',
    items: [
      { cmd: 'Bloquea la pantalla', desc: 'Bloquea el teléfono', tip: 'Requiere: Administrador de dispositivo en Ajustes' },
      { cmd: 'Enciende la pantalla', desc: 'Enciende la pantalla desde el servicio de voz' },
      { cmd: 'Enciende la linterna / Apaga la linterna', desc: 'Control de linterna' },
      { cmd: 'Sube el volumen a [0-15]', desc: 'Ajusta el volumen del media' },
      { cmd: 'Baja el volumen', desc: 'Reduce el volumen del media' },
      { cmd: 'Pon el brillo al máximo / Baja el brillo', desc: 'Controla el brillo de pantalla', tip: 'Requiere: Escritura en ajustes del sistema' },
      { cmd: 'Lee mis notificaciones', desc: 'Resume notificaciones pendientes con IA', tip: 'Requiere: Acceso a notificaciones en Ajustes' },
    ],
  },
  {
    id: 'phone',
    icon: 'call-outline',
    title: 'Llamadas y mensajes',
    items: [
      { cmd: 'Llama a [nombre o número]', desc: 'Realiza una llamada directamente' },
      { cmd: 'Envíale un WhatsApp a [nombre] diciendo [mensaje]', desc: 'Abre WhatsApp con mensaje pre-llenado' },
      { cmd: 'Manda un SMS a [nombre] que [mensaje]', desc: 'Envía un SMS directo' },
      { cmd: 'Manda un correo a [destinatario] sobre [asunto]', desc: 'Abre el cliente de correo' },
    ],
  },
  {
    id: 'music',
    icon: 'musical-notes-outline',
    title: 'Música y apps',
    items: [
      { cmd: 'Reanuda la música / Pon la música', desc: 'Reanuda la reproducción activa' },
      { cmd: 'Pon música de [artista o canción]', desc: 'Abre YouTube Music con la búsqueda' },
      { cmd: 'Pon [canción] en Spotify', desc: 'Abre Spotify directamente' },
      { cmd: 'Abre WhatsApp / Telegram / Instagram / Maps / Gmail', desc: 'Abre cualquier app instalada' },
      { cmd: 'Abre YouTube y busca [tema]', desc: 'Busca en YouTube' },
    ],
  },
  {
    id: 'reminders',
    icon: 'alarm-outline',
    title: 'Recordatorios',
    items: [
      { cmd: 'Recuérdame [tarea] mañana a las 9am', desc: 'Crea recordatorio con notificación' },
      { cmd: 'Recuérdame [cosa] en 2 horas', desc: 'Recordatorio relativo al tiempo actual' },
      { cmd: 'Pon una alarma el viernes a las 8', desc: 'Recordatorio semanal' },
    ],
  },
  {
    id: 'memory',
    icon: 'brain-outline',
    title: 'Memoria',
    items: [
      { desc: 'Aria recuerda automáticamente tus preferencias, alergias, eventos y personas importantes' },
      { cmd: '¿Qué sabes de mí?', desc: 'Ver qué ha guardado Aria sobre ti' },
      { desc: 'Puedes ver y editar el mapa mental de memoria en la sección "Memoria" de la app' },
    ],
  },
  {
    id: 'modes',
    icon: 'car-outline',
    title: 'Modos especiales',
    items: [
      { cmd: 'Activa modo conducción', desc: 'Respuestas ultra-cortas de 1 oración, seguro mientras manejas', tip: 'También se activa en Ajustes → Control del dispositivo' },
      { desc: 'Modo voz: automático cuando usas el wake word — respuestas conversacionales cortas sin markdown' },
      { cmd: 'Apaga el modo conducción', desc: 'Vuelve a respuestas normales' },
    ],
  },
  {
    id: 'tips',
    icon: 'bulb-outline',
    title: 'Consejos y trucos',
    items: [
      { desc: 'Di el nombre del contacto tal como aparece guardado en tu teléfono para llamadas y mensajes' },
      { desc: 'Puedes hacer preguntas de seguimiento sin repetir Hey Aria — la conversación dura 8 segundos' },
      { desc: 'Si Aria no te escucha, verifica que el micrófono no esté siendo usado por otra app' },
      { desc: 'Para mejor rendimiento: Ajustes del sistema → Batería → App no optimizada → AI Companion' },
      { desc: 'El widget de pantalla de inicio permite activar a Aria con un tap sin decir Hey Aria' },
    ],
  },
]

export default function HelpScreen() {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>('start')

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>¿Cómo usar Aria?</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles" size={32} color={C.primary} />
          </View>
          <Text style={styles.heroTitle}>Aria — Tu asistente Jarvis</Text>
          <Text style={styles.heroSub}>
            Actívala con tu voz, controla tu teléfono y mantén conversaciones naturales — sin tocar la pantalla.
          </Text>
        </View>

        {/* Quick reference chips */}
        <View style={styles.quickRow}>
          {['Hey Aria', 'Llama a...', 'Linterna', 'Notificaciones', 'Clima', 'WhatsApp'].map(chip => (
            <View key={chip} style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
            </View>
          ))}
        </View>

        {/* Sections */}
        {SECTIONS.map(sec => (
          <View key={sec.id} style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggle(sec.id)}
              activeOpacity={0.75}
            >
              <View style={styles.sectionLeft}>
                <Ionicons name={sec.icon as any} size={18} color={C.primary} />
                <Text style={styles.sectionTitle}>{sec.title}</Text>
              </View>
              <Ionicons
                name={expanded === sec.id ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={C.textSecondary}
              />
            </TouchableOpacity>

            {expanded === sec.id && (
              <View style={styles.sectionBody}>
                {sec.items.map((item, i) => (
                  <View key={i} style={styles.item}>
                    {item.cmd && (
                      <View style={styles.cmdRow}>
                        <Ionicons name="mic" size={12} color={C.primary} style={{ marginTop: 2 }} />
                        <Text style={styles.cmd}>&quot;{item.cmd}&quot;</Text>
                      </View>
                    )}
                    <Text style={[styles.desc, !item.cmd && styles.descOnly]}>{item.desc}</Text>
                    {item.tip && (
                      <Text style={styles.tip}>💡 {item.tip}</Text>
                    )}
                    {i < sec.items.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿Algo no funciona? Verifica los permisos en{' '}
            <Text style={styles.footerLink} onPress={() => router.push('/(app)/settings' as never)}>
              Ajustes
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  scroll:  { padding: 16, paddingBottom: 40 },

  hero:       { alignItems: 'center', paddingVertical: 20, gap: 8 },
  heroIcon:   { width: 64, height: 64, borderRadius: 20, backgroundColor: C.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroTitle:  { fontSize: 20, fontWeight: '800', color: C.textPrimary },
  heroSub:    { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip:     { backgroundColor: C.primaryMuted, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.primary },
  chipText: { fontSize: 12, color: C.primary, fontWeight: '600' },

  section:       { backgroundColor: C.surface, borderRadius: 14, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  sectionLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  sectionBody:   { paddingHorizontal: 14, paddingBottom: 10 },

  item:     { paddingVertical: 8 },
  cmdRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 3 },
  cmd:      { fontSize: 13, fontWeight: '600', color: C.primary, flex: 1 },
  desc:     { fontSize: 13, color: C.textSecondary, lineHeight: 18 },
  descOnly: { fontSize: 13, color: C.textSecondary, lineHeight: 18, paddingLeft: 4 },
  tip:      { fontSize: 11, color: C.textSecondary, marginTop: 3, fontStyle: 'italic' },
  divider:  { height: 1, backgroundColor: C.border, marginTop: 8 },

  footer:     { alignItems: 'center', paddingTop: 16 },
  footerText: { fontSize: 13, color: C.textSecondary, textAlign: 'center' },
  footerLink: { color: C.primary, fontWeight: '600' },
})
