import { useRef, useState } from 'react'
import {
  Animated, Dimensions, Modal, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { C } from '@/lib/theme'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    icon:  'sparkles' as const,
    color: C.primary,
    title: 'Hola, soy Aria',
    body:  'Tu asistente personal de IA, siempre contigo. Puedo ayudarte con cualquier cosa — respuestas, tareas, control de tu teléfono y mucho más.',
  },
  {
    icon:  'mic' as const,
    color: '#8b5cf6',
    title: 'Actívame con tu voz',
    body:  'Di "Hey Aria" o "Hola Aria" en cualquier momento para empezar. Luego habla con normalidad — respondo y sigo escuchando 8 segundos para tu siguiente pregunta.',
    tips: ['Hey Aria, ¿cómo está el clima?', 'Oye Aria, llama a mamá', 'Hola Aria, reanuda la música'],
  },
  {
    icon:  'phone-portrait' as const,
    color: '#059669',
    title: 'Controlo tu teléfono',
    body:  'Bloquea la pantalla, enciende la linterna, ajusta el volumen, lee tus notificaciones y abre cualquier app — todo por voz o por chat.',
    tips: ['Bloquea la pantalla', 'Enciende la linterna', 'Lee mis notificaciones'],
  },
  {
    icon:  'chatbubbles' as const,
    color: '#d97706',
    title: 'Más que un asistente',
    body:  'Recuerdo tus preferencias, te ayudo a redactar mensajes, busco información en tiempo real y me integro con WhatsApp, Spotify, YouTube y más.',
    tips: ['Manda WhatsApp a Juan', 'Busca vuelos a Cartagena', 'Pon Bad Bunny en Spotify'],
  },
  {
    icon:  'checkmark-circle' as const,
    color: C.primary,
    title: '¡Todo listo!',
    body:  'Activa "Escuchar siempre" en Ajustes para usar el wake word. Y si necesitas ayuda, toca el botón ? en el chat.',
  },
]

interface Props {
  visible: boolean
  onClose: () => void
}

export default function OnboardingModal({ visible, onClose }: Props) {
  const [page, setPage] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const isLast = page === SLIDES.length - 1

  const goTo = (index: number) => {
    setPage(index)
    scrollRef.current?.scrollTo({ x: index * width, animated: true })
  }

  const handleScroll = (e: any) => {
    const newPage = Math.round(e.nativeEvent.contentOffset.x / width)
    if (newPage !== page) setPage(newPage)
  }

  const slide = SLIDES[page]

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* Slides */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
          >
            {SLIDES.map((s, i) => (
              <View key={i} style={styles.slide}>
                <View style={[styles.iconWrap, { backgroundColor: s.color + '22' }]}>
                  <Ionicons name={s.icon} size={40} color={s.color} />
                </View>
                <Text style={styles.slideTitle}>{s.title}</Text>
                <Text style={styles.slideBody}>{s.body}</Text>
                {s.tips && (
                  <View style={styles.tips}>
                    {s.tips.map((tip, j) => (
                      <View key={j} style={styles.tipRow}>
                        <Ionicons name="mic-outline" size={12} color={C.primary} />
                        <Text style={styles.tipText}>&ldquo;{tip}&rdquo;</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Dots */}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <Pressable key={i} onPress={() => goTo(i)}>
                <View style={[styles.dot, i === page && styles.dotActive]} />
              </Pressable>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {!isLast ? (
              <>
                <Pressable onPress={onClose} style={styles.skipBtn}>
                  <Text style={styles.skipText}>Saltar</Text>
                </Pressable>
                <Pressable onPress={() => goTo(page + 1)} style={styles.nextBtn}>
                  <Text style={styles.nextText}>Siguiente</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </Pressable>
              </>
            ) : (
              <Pressable onPress={onClose} style={[styles.nextBtn, { flex: 1 }]}>
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.nextText}>¡Empezar con Aria!</Text>
              </Pressable>
            )}
          </View>

        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card:    { backgroundColor: C.surface, borderRadius: 24, width: '100%', maxWidth: 380, overflow: 'hidden' },

  slide:    { width: width - 40, maxWidth: 380, padding: 28, alignItems: 'center', gap: 12 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  slideTitle: { fontSize: 22, fontWeight: '800', color: C.textPrimary, textAlign: 'center' },
  slideBody:  { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 21 },

  tips:    { width: '100%', gap: 8, marginTop: 4 },
  tipRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryMuted, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  tipText: { fontSize: 13, color: C.primary, fontStyle: 'italic', flex: 1 },

  dots:    { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  dot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotActive: { width: 20, backgroundColor: C.primary },

  actions: { flexDirection: 'row', gap: 10, padding: 20, paddingTop: 4 },
  skipBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: C.surface2 },
  skipText: { fontSize: 14, color: C.textSecondary, fontWeight: '500' },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, paddingVertical: 12, borderRadius: 12 },
  nextText: { fontSize: 14, color: '#fff', fontWeight: '700' },
})
