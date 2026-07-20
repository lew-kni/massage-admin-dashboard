// Body-area catalogue used by the pre-massage assessment sheet. `value` is what
// gets stored on AssessmentFinding.bodyPart; the muscle lists are suggestions
// only — the therapist can always type a name that isn't here.

export interface BodyPart {
  value: string
  label: string
  /** Whether a left/right distinction is meaningful for this area. */
  paired: boolean
  muscles: string[]
}

export const BODY_PARTS: BodyPart[] = [
  {
    value: 'neck',
    label: 'Neck',
    paired: true,
    muscles: [
      'Sternocleidomastoid',
      'Upper trapezius',
      'Levator scapulae',
      'Scalenes',
      'Splenius capitis',
      'Splenius cervicis',
      'Suboccipitals',
    ],
  },
  {
    value: 'shoulders',
    label: 'Shoulders',
    paired: true,
    muscles: [
      'Anterior deltoid',
      'Lateral deltoid',
      'Posterior deltoid',
      'Supraspinatus',
      'Infraspinatus',
      'Teres minor',
      'Teres major',
      'Subscapularis',
      'Rhomboid major',
      'Rhomboid minor',
    ],
  },
  {
    value: 'upper-back',
    label: 'Upper back',
    paired: true,
    muscles: [
      'Middle trapezius',
      'Lower trapezius',
      'Rhomboids',
      'Erector spinae (thoracic)',
      'Latissimus dorsi',
      'Serratus posterior superior',
    ],
  },
  {
    value: 'lower-back',
    label: 'Lower back',
    paired: true,
    muscles: [
      'Erector spinae (lumbar)',
      'Quadratus lumborum',
      'Multifidus',
      'Thoracolumbar fascia',
      'Psoas major',
    ],
  },
  {
    value: 'chest',
    label: 'Chest',
    paired: true,
    muscles: [
      'Pectoralis major',
      'Pectoralis minor',
      'Serratus anterior',
      'Intercostals',
      'Subclavius',
    ],
  },
  {
    value: 'stomach',
    label: 'Stomach / abdomen',
    paired: false,
    muscles: [
      'Rectus abdominis',
      'External oblique',
      'Internal oblique',
      'Transversus abdominis',
      'Diaphragm',
    ],
  },
  {
    value: 'upper-arm',
    label: 'Upper arm',
    paired: true,
    muscles: ['Biceps brachii', 'Triceps brachii', 'Brachialis', 'Coracobrachialis'],
  },
  {
    value: 'lower-arm',
    label: 'Lower arm / forearm',
    paired: true,
    muscles: [
      'Brachioradialis',
      'Wrist flexors',
      'Wrist extensors',
      'Pronator teres',
      'Supinator',
      'Common extensor origin',
    ],
  },
  {
    value: 'hand-wrist',
    label: 'Hand & wrist',
    paired: true,
    muscles: ['Thenar group', 'Hypothenar group', 'Lumbricals', 'Carpal tunnel structures'],
  },
  {
    value: 'glutes',
    label: 'Glutes',
    paired: true,
    muscles: [
      'Gluteus maximus',
      'Gluteus medius',
      'Gluteus minimus',
      'Piriformis',
      'Tensor fasciae latae',
      'Deep lateral rotators',
    ],
  },
  {
    value: 'hips',
    label: 'Hips & pelvis',
    paired: true,
    muscles: [
      'Iliopsoas',
      'Rectus femoris',
      'Sartorius',
      'Adductor group',
      'Pectineus',
      'Iliotibial band',
    ],
  },
  {
    value: 'upper-leg',
    label: 'Upper leg / thigh',
    paired: true,
    muscles: [
      'Rectus femoris',
      'Vastus lateralis',
      'Vastus medialis',
      'Vastus intermedius',
      'Biceps femoris',
      'Semitendinosus',
      'Semimembranosus',
      'Adductor magnus',
      'Iliotibial band',
    ],
  },
  {
    value: 'lower-leg',
    label: 'Lower leg / calf',
    paired: true,
    muscles: [
      'Gastrocnemius',
      'Soleus',
      'Tibialis anterior',
      'Tibialis posterior',
      'Peroneals',
      'Achilles tendon',
      'Popliteus',
    ],
  },
  {
    value: 'foot-ankle',
    label: 'Foot & ankle',
    paired: true,
    muscles: ['Plantar fascia', 'Intrinsic foot muscles', 'Achilles insertion', 'Ankle retinaculum'],
  },
  {
    value: 'head-face',
    label: 'Head & face',
    paired: false,
    muscles: ['Masseter', 'Temporalis', 'Occipitofrontalis', 'Pterygoids'],
  },
]

export function findBodyPart(value: string): BodyPart | undefined {
  return BODY_PARTS.find(p => p.value === value)
}

export function bodyPartLabel(value: string): string {
  return findBodyPart(value)?.label ?? value
}

export const SIDE_OPTIONS = [
  { value: 'N/A', label: 'N/A' },
  { value: 'LEFT', label: 'Left' },
  { value: 'RIGHT', label: 'Right' },
  { value: 'BOTH', label: 'Both' },
] as const

export const SOURCE_OPTIONS = [
  { value: 'OBSERVED', label: 'Observed', hint: 'You saw or felt it during assessment' },
  { value: 'REPORTED', label: 'Client reported', hint: 'The client told you about it' },
] as const
