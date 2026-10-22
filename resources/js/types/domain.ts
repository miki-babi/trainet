export type Persona = 'client' | 'professional' | null;

export type Workspace = {
    id: number;
    name: string;
    type: string;
};

export type ProfessionalProfile = {
    id: number;
    professional_type: 'trainer' | 'nutritionist' | 'both';
    bio: string | null;
    credentials: string | null;
};

export type ClientProfile = {
    id: number;
    onboarding_status: string;
    goals_summary: string | null;
    experience_level: string | null;
    equipment: string[] | null;
    training_days: number[] | null;
    dietary_preferences: string[] | null;
    allergies: string | null;
};

export type ExerciseCategory = {
    id: number;
    name: string;
};

export type MuscleGroup = {
    id: number;
    name: string;
};

export type Equipment = {
    id: number;
    name: string;
};

export type Exercise = {
    id: number;
    name: string;
    exercise_category_id: number | null;
    category?: ExerciseCategory;
    difficulty: string;
    movement_pattern: string | null;
    instructions: string | null;
    common_mistakes: string | null;
    safety_notes: string | null;
    video_url: string | null;
    is_custom: boolean;
    media_url?: string | null;
    media_urls?: string[];
    media?: { id: number; path: string; type: string }[];
    muscle_groups?: MuscleGroup[];
    equipment?: Equipment[];
    alternatives?: Exercise[];
};

export type PersonalRecord = {
    id: number;
    exercise_id: number;
    type: string;
    value: number;
    achieved_at: string;
};

export type TrainingProgram = {
    id: number;
    name: string;
    description: string | null;
    status: string;
    versions_count?: number;
    current_version?: TrainingProgramVersion;
    days?: TrainingDay[];
};

export type TrainingProgramVersion = {
    id: number;
    version_number: number;
    change_summary: string | null;
    published_at: string | null;
    days?: TrainingDay[];
};

export type TrainingDay = {
    id: number;
    order: number;
    title: string;
    is_rest_day: boolean;
    notes: string | null;
    exercises?: TrainingDayExercise[];
};

export type TrainingDayExercise = {
    id: number;
    order: number;
    exercise_id: number;
    exercise: Exercise;
    group_label: string | null;
    sets: number | null;
    reps: string | null;
    target_load: number | null;
    duration_seconds: number | null;
    distance_meters: number | null;
    rpe: number | null;
    rir: number | null;
    tempo: string | null;
    rest_seconds: number | null;
    notes: string | null;
};

export type ProgramAssignment = {
    id: number;
    program_version_id: number;
    starts_on: string;
    ends_on: string | null;
    status: string;
    schedule_days: number[] | null;
    program_version?: TrainingProgramVersion & {
        program?: TrainingProgram;
    };
};

export type WorkoutSession = {
    id: number;
    status: 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'skipped';
    scheduled_for: string | null;
    started_at: string | null;
    completed_at: string | null;
    duration_seconds: number | null;
    notes: string | null;
    training_day?: { id: number; title: string } | null;
    exercises?: WorkoutSessionExercise[];
};

export type WorkoutSessionExercise = {
    id: number;
    exercise_id: number;
    exercise: Exercise;
    replaced_exercise_id: number | null;
    order: number;
    group_label: string | null;
    target_sets: number | null;
    target_reps: string | null;
    target_load: number | null;
    target_duration_seconds: number | null;
    target_rpe: number | null;
    rest_seconds: number | null;
    notes: string | null;
    status: string;
    sets?: WorkoutSet[];
};

export type WorkoutSet = {
    id: number;
    set_order: number;
    planned_reps: number | null;
    planned_load: number | null;
    actual_reps: number | null;
    actual_load: number | null;
    actual_rpe: number | null;
    status: 'pending' | 'done' | 'skipped';
    notes: string | null;
};

export type Food = {
    id: number;
    name: string;
    category_id: number | null;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number | null;
    serving_description: string | null;
};

export type MealItem = {
    id: number;
    food_id: number;
    food?: Food;
    quantity: number;
    portion_id: number | null;
    notes: string | null;
};

export type Meal = {
    id: number;
    name: string;
    time_hint: string | null;
    notes: string | null;
    order: number;
    image_url?: string | null;
    items?: MealItem[];
};

export type NutritionTargets = {
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    water_ml: number | null;
};

export type Habit = {
    id: number;
    name: string;
    description: string | null;
};

export type CheckInQuestion = {
    id: number;
    order: number;
    prompt: string;
    type: 'rating' | 'text' | 'photo' | 'adherence';
    required: boolean;
};

export type CheckInSubmission = {
    id: number;
    status: string;
    due_on: string;
    submitted_at: string | null;
    answers?: CheckInAnswer[];
    review?: { comment: string | null; reviewed_at: string } | null;
};

export type CheckInAnswer = {
    id: number;
    question_id: number;
    value_rating: number | null;
    value_text: string | null;
    question?: CheckInQuestion;
};

export type Conversation = {
    id: number;
    title: string | null;
    unread_count?: number;
    last_message?: Message | null;
    other_party?: { id: number; name: string; avatar?: string };
};

export type Message = {
    id: number;
    conversation_id: number;
    sender_id: number;
    body: string;
    created_at: string;
    sender?: { id: number; name: string };
};

export type Appointment = {
    id: number;
    type_name?: string;
    starts_at: string;
    ends_at: string;
    status: string;
    location_note: string | null;
    with_name?: string;
};

export type Goal = {
    id: number;
    title: string;
    metric: string;
    target_value: number | null;
    start_value: number | null;
    unit: string | null;
    due_on: string | null;
    status: string;
};
