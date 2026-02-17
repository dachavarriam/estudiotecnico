
export const NOCODB_TABLES = {
    technical_studies: "mxyg1dg5evhjdgl",
    study_materials: "mfczeprv9lw8bwp",
    study_photos: "m3y0u65lc7pwwsv", 
    study_actions: "ml1z4qub10s8v6o",
    study_comments: "mxwywcxq7otiomy",
    voice_notes: "m208gwjtim49z1u",
    supplies: "mlbjb58ncfdytw8",
    users: "myyvu2xakmkxqz3"
};

export const STUDY_STATUS_MAP: Record<string, string> = {
    'draft': 'Borrador',
    'review': 'En Revisión',
    'approved': 'Aprobado',
    'rejected': 'Rechazado'
};

export const STATUS_COLORS: Record<string, string> = {
    'draft': 'bg-gray-200 text-gray-700',
    'review': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800'
};
