import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, Switch,
  Alert, TouchableOpacity, TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Relationship {
  name: string
  relation: string
  notes: string
}

interface UserProfile {
  personal: {
    city: string; country: string; birthdate: string
    occupation: string; marital_status: string; children: string
  }
  health: {
    allergies: string; conditions: string; medications: string
    blood_type: string; fitness_goals: string
  }
  preferences: {
    diet: string; favorite_foods: string; disliked_foods: string
    hobbies: string; music: string; sports: string
  }
  routines: {
    wake_time: string; sleep_time: string; work_schedule: string
    exercise_frequency: string; exercise_type: string
  }
  relationships: Relationship[]
  goals: {
    short_term: string; long_term: string; savings_goal: string
  }
}

const empty: UserProfile = {
  personal:      { city: '', country: '', birthdate: '', occupation: '', marital_status: '', children: '' },
  health:        { allergies: '', conditions: '', medications: '', blood_type: '', fitness_goals: '' },
  preferences:   { diet: '', favorite_foods: '', disliked_foods: '', hobbies: '', music: '', sports: '' },
  routines:      { wake_time: '', sleep_time: '', work_schedule: '', exercise_frequency: '', exercise_type: '' },
  relationships: [],
  goals:         { short_term: '', long_term: '', savings_goal: '' },
}

// API returns arrays — convert to comma-separated strings for editing
function apiToForm(data: Record<string, unknown>): UserProfile {
  const toStr = (v: unknown) => Array.isArray(v) ? v.join(', ') : (v as string) ?? ''
  return {
    personal: {
      city:           (data.personal as Record<string, string>)?.city           ?? '',
      country:        (data.personal as Record<string, string>)?.country        ?? '',
      birthdate:      (data.personal as Record<string, string>)?.birthdate      ?? '',
      occupation:     (data.personal as Record<string, string>)?.occupation     ?? '',
      marital_status: (data.personal as Record<string, string>)?.marital_status ?? '',
      children:       String((data.personal as Record<string, unknown>)?.children ?? ''),
    },
    health: {
      allergies:    toStr((data.health as Record<string, unknown>)?.allergies),
      conditions:   toStr((data.health as Record<string, unknown>)?.conditions),
      medications:  toStr((data.health as Record<string, unknown>)?.medications),
      blood_type:   (data.health as Record<string, string>)?.blood_type   ?? '',
      fitness_goals: toStr((data.health as Record<string, unknown>)?.fitness_goals),
    },
    preferences: {
      diet:           (data.preferences as Record<string, string>)?.diet           ?? '',
      favorite_foods: toStr((data.preferences as Record<string, unknown>)?.favorite_foods),
      disliked_foods: toStr((data.preferences as Record<string, unknown>)?.disliked_foods),
      hobbies:        toStr((data.preferences as Record<string, unknown>)?.hobbies),
      music:          toStr((data.preferences as Record<string, unknown>)?.music),
      sports:         toStr((data.preferences as Record<string, unknown>)?.sports),
    },
    routines: {
      wake_time:          (data.routines as Record<string, string>)?.wake_time          ?? '',
      sleep_time:         (data.routines as Record<string, string>)?.sleep_time         ?? '',
      work_schedule:      (data.routines as Record<string, string>)?.work_schedule      ?? '',
      exercise_frequency: (data.routines as Record<string, string>)?.exercise_frequency ?? '',
      exercise_type:      (data.routines as Record<string, string>)?.exercise_type      ?? '',
    },
    relationships: (data.relationships as Relationship[]) ?? [],
    goals: {
      short_term:  toStr((data.goals as Record<string, unknown>)?.short_term),
      long_term:   toStr((data.goals as Record<string, unknown>)?.long_term),
      savings_goal: (data.goals as Record<string, string>)?.savings_goal ?? '',
    },
  }
}

// Convert comma-separated strings back to arrays before saving
function formToApi(form: UserProfile) {
  const toArr = (s: string) => s.split(',').map(v => v.trim()).filter(Boolean)
  return {
    personal: {
      ...form.personal,
      children: form.personal.children ? parseInt(form.personal.children) : 0,
    },
    health: {
      blood_type:   form.health.blood_type,
      allergies:    toArr(form.health.allergies),
      conditions:   toArr(form.health.conditions),
      medications:  toArr(form.health.medications),
      fitness_goals: toArr(form.health.fitness_goals),
    },
    preferences: {
      diet:           form.preferences.diet,
      favorite_foods: toArr(form.preferences.favorite_foods),
      disliked_foods: toArr(form.preferences.disliked_foods),
      hobbies:        toArr(form.preferences.hobbies),
      music:          toArr(form.preferences.music),
      sports:         toArr(form.preferences.sports),
    },
    routines: form.routines,
    relationships: form.relationships,
    goals: {
      savings_goal: form.goals.savings_goal,
      short_term:   toArr(form.goals.short_term),
      long_term:    toArr(form.goals.long_term),
    },
  }
}

function Field({ label, hint, value, onChangeText, placeholder, keyboard }: {
  label: string; hint?: string; value: string
  onChangeText: (v: string) => void; placeholder?: string; keyboard?: 'default' | 'numeric'
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ''}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboard ?? 'default'}
      />
    </View>
  )
}

function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{emoji} {title}</Text>
      {children}
    </View>
  )
}

export default function ProfileScreen() {
  const [form, setForm] = useState<UserProfile>(empty)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/profile').then(({ data }) => {
      if (data && Object.keys(data).length) setForm(apiToForm(data))
    }).catch(() => {})
  }, [])

  const up = <K extends keyof UserProfile>(section: K) =>
    (key: string, value: string) =>
      setForm(f => ({ ...f, [section]: { ...(f[section] as object), [key]: value } }))

  const addRelationship = () =>
    setForm(f => ({ ...f, relationships: [...f.relationships, { name: '', relation: '', notes: '' }] }))

  const updateRel = (index: number, key: keyof Relationship, value: string) =>
    setForm(f => {
      const rels = [...f.relationships]
      rels[index] = { ...rels[index], [key]: value }
      return { ...f, relationships: rels }
    })

  const removeRel = (index: number) =>
    setForm(f => ({ ...f, relationships: f.relationships.filter((_, i) => i !== index) }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/profile', formToApi(form))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      Alert.alert('Error', 'No se pudo guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Mi Perfil</Text>
          <Text style={styles.subtitle}>Tu asistente usa esta información para conocerte y ayudarte mejor</Text>
        </View>

        <Section title="Datos personales" emoji="👤">
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Ciudad" value={form.personal.city} onChangeText={v => up('personal')('city', v)} placeholder="Bogotá" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="País" value={form.personal.country} onChangeText={v => up('personal')('country', v)} placeholder="Colombia" />
            </View>
          </View>
          <Field label="Fecha de nacimiento" value={form.personal.birthdate} onChangeText={v => up('personal')('birthdate', v)} placeholder="1990-05-15" />
          <Field label="Ocupación" value={form.personal.occupation} onChangeText={v => up('personal')('occupation', v)} placeholder="Desarrollador de software" />
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Estado civil" value={form.personal.marital_status} onChangeText={v => up('personal')('marital_status', v)} placeholder="soltero" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Hijos" value={form.personal.children} onChangeText={v => up('personal')('children', v)} placeholder="0" keyboard="numeric" />
            </View>
          </View>
        </Section>

        <Section title="Salud" emoji="🏥">
          <Field
            label="Alergias"
            hint="Separadas por coma"
            value={form.health.allergies}
            onChangeText={v => up('health')('allergies', v)}
            placeholder="mariscos, nueces, penicilina"
          />
          <Field
            label="Condiciones médicas"
            hint="Separadas por coma"
            value={form.health.conditions}
            onChangeText={v => up('health')('conditions', v)}
            placeholder="diabetes tipo 2, hipertensión"
          />
          <Field
            label="Medicamentos actuales"
            hint="Separados por coma"
            value={form.health.medications}
            onChangeText={v => up('health')('medications', v)}
            placeholder="metformina 500mg"
          />
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Tipo de sangre" value={form.health.blood_type} onChangeText={v => up('health')('blood_type', v)} placeholder="O+" />
            </View>
          </View>
          <Field
            label="Metas de salud"
            hint="Separadas por coma"
            value={form.health.fitness_goals}
            onChangeText={v => up('health')('fitness_goals', v)}
            placeholder="bajar 5kg, correr 5km"
          />
        </Section>

        <Section title="Preferencias" emoji="❤️">
          <Field label="Tipo de dieta" value={form.preferences.diet} onChangeText={v => up('preferences')('diet', v)} placeholder="omnívoro, vegetariano, vegano..." />
          <Field
            label="Comidas favoritas"
            hint="Separadas por coma"
            value={form.preferences.favorite_foods}
            onChangeText={v => up('preferences')('favorite_foods', v)}
            placeholder="pizza, sushi, arepas"
          />
          <Field
            label="Comidas que no le gustan"
            hint="Separadas por coma"
            value={form.preferences.disliked_foods}
            onChangeText={v => up('preferences')('disliked_foods', v)}
            placeholder="cilantro, hígado"
          />
          <Field
            label="Hobbies e intereses"
            hint="Separados por coma"
            value={form.preferences.hobbies}
            onChangeText={v => up('preferences')('hobbies', v)}
            placeholder="programar, videojuegos, leer"
          />
          <Field
            label="Música favorita"
            hint="Géneros o artistas, separados por coma"
            value={form.preferences.music}
            onChangeText={v => up('preferences')('music', v)}
            placeholder="rock, electrónica, Bad Bunny"
          />
          <Field
            label="Deportes"
            hint="Separados por coma"
            value={form.preferences.sports}
            onChangeText={v => up('preferences')('sports', v)}
            placeholder="fútbol, ciclismo, natación"
          />
        </Section>

        <Section title="Rutinas" emoji="⏰">
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Me despierto a las" value={form.routines.wake_time} onChangeText={v => up('routines')('wake_time', v)} placeholder="07:00" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Me duermo a las" value={form.routines.sleep_time} onChangeText={v => up('routines')('sleep_time', v)} placeholder="23:00" />
            </View>
          </View>
          <Field label="Horario de trabajo" value={form.routines.work_schedule} onChangeText={v => up('routines')('work_schedule', v)} placeholder="09:00-18:00" />
          <Field label="Frecuencia de ejercicio" value={form.routines.exercise_frequency} onChangeText={v => up('routines')('exercise_frequency', v)} placeholder="3 veces/semana" />
          <Field label="Tipo de ejercicio" value={form.routines.exercise_type} onChangeText={v => up('routines')('exercise_type', v)} placeholder="gimnasio, correr, yoga..." />
        </Section>

        <Section title="Personas importantes" emoji="👥">
          <Text style={styles.fieldHint}>Familia, amigos y contactos clave para tu asistente</Text>
          {form.relationships.map((rel, i) => (
            <View key={i} style={styles.relCard}>
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Field label="Nombre" value={rel.name} onChangeText={v => updateRel(i, 'name', v)} placeholder="María" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Relación" value={rel.relation} onChangeText={v => updateRel(i, 'relation', v)} placeholder="madre, amigo..." />
                </View>
              </View>
              <Field label="Notas" value={rel.notes} onChangeText={v => updateRel(i, 'notes', v)} placeholder="cumpleaños 15 de marzo" />
              <TouchableOpacity onPress={() => removeRel(i)} style={styles.removeBtn}>
                <Text style={styles.removeTxt}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={addRelationship} style={styles.addBtn}>
            <Text style={styles.addTxt}>+ Agregar persona</Text>
          </TouchableOpacity>
        </Section>

        <Section title="Metas y objetivos" emoji="🎯">
          <Field
            label="Metas a corto plazo"
            hint="Separadas por coma"
            value={form.goals.short_term}
            onChangeText={v => up('goals')('short_term', v)}
            placeholder="terminar proyecto X, aprender React Native"
          />
          <Field
            label="Metas a largo plazo"
            hint="Separadas por coma"
            value={form.goals.long_term}
            onChangeText={v => up('goals')('long_term', v)}
            placeholder="comprar casa, iniciar empresa"
          />
          <Field
            label="Meta de ahorro"
            value={form.goals.savings_goal}
            onChangeText={v => up('goals')('savings_goal', v)}
            placeholder="viaje a Europa, fondo de emergencia"
          />
        </Section>

        <Button
          label={saving ? 'Guardando...' : saved ? '✓ Perfil guardado' : 'Guardar perfil'}
          onPress={handleSave}
          loading={saving}
          size="lg"
        />

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#fff' },
  scroll:  { padding: 20, gap: 20 },
  header:  { gap: 4 },
  title:   { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#94a3b8', lineHeight: 18 },
  section: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, gap: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  field:   { gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569' },
  fieldHint:  { fontSize: 11, color: '#94a3b8' },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 14, color: '#1e293b', backgroundColor: '#fff',
  },
  row2: { flexDirection: 'row', gap: 12 },
  relCard: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 12, gap: 10, backgroundColor: '#fff',
  },
  removeBtn: { alignSelf: 'flex-end' },
  removeTxt: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  addBtn: {
    borderWidth: 1.5, borderColor: '#6366f1', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', borderStyle: 'dashed',
  },
  addTxt: { color: '#6366f1', fontWeight: '600', fontSize: 14 },
})
