<?php

namespace Database\Seeders;

use App\Enums\AssignmentStatus;
use App\Enums\CheckInSubmissionStatus;
use App\Enums\ContentStatus;
use App\Enums\GoalStatus;
use App\Enums\OnboardingStatus;
use App\Enums\ProfessionalType;
use App\Enums\RelationshipType;
use App\Enums\VersionStatus;
use App\Enums\WorkoutSessionStatus;
use App\Enums\WorkspaceMemberRole;
use App\Enums\WorkStatus;
use App\Models\Appointment;
use App\Models\AppointmentEvent;
use App\Models\AppointmentType;
use App\Models\AvailabilityRule;
use App\Models\CheckInAnswer;
use App\Models\CheckInQuestion;
use App\Models\CheckInReview;
use App\Models\CheckInSchedule;
use App\Models\CheckInSubmission;
use App\Models\CheckInTemplate;
use App\Models\ClientMetricEntry;
use App\Models\ClientNote;
use App\Models\ClientProfile;
use App\Models\ClientTag;
use App\Models\Conversation;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\ExerciseCategory;
use App\Models\Food;
use App\Models\FoodCategory;
use App\Models\FoodLog;
use App\Models\FoodLogItem;
use App\Models\FoodPortion;
use App\Models\Goal;
use App\Models\Habit;
use App\Models\HabitAssignment;
use App\Models\HabitLog;
use App\Models\Meal;
use App\Models\MealItem;
use App\Models\Message;
use App\Models\MetricDefinition;
use App\Models\MuscleGroup;
use App\Models\NotificationPreference;
use App\Models\NutritionAssignment;
use App\Models\NutritionPlan;
use App\Models\NutritionPlanDay;
use App\Models\NutritionPlanVersion;
use App\Models\NutritionTarget;
use App\Models\PersonalRecord;
use App\Models\ProfessionalClientAssignment;
use App\Models\ProfessionalProfile;
use App\Models\ProgramAssignment;
use App\Models\ProgressPhoto;
use App\Models\TrainingDay;
use App\Models\TrainingDayExercise;
use App\Models\TrainingProgram;
use App\Models\TrainingProgramVersion;
use App\Models\User;
use App\Models\WaterLog;
use App\Models\WorkoutSession;
use App\Models\WorkoutSessionExercise;
use App\Models\WorkoutSet;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Carbon\CarbonInterface;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class DemoSeeder extends Seeder
{
    private Workspace $workspace;

    private User $coach;

    private User $nutritionist;

    private User $assistant;

    /** @var array<string, ClientProfile> */
    private array $clients = [];

    /** @var array<string, Exercise> */
    private array $exercises = [];

    public function run(): void
    {
        $this->seedWorkspaceAndPeople();
        $this->seedExerciseLibrary();
        $this->seedProgramsAndSessions();
        $this->seedNutrition();
        $this->seedProgressAndCheckIns();
        $this->seedMessaging();
        $this->seedScheduling();
    }

    private function makeUser(string $name, string $email): User
    {
        return User::create([
            'name' => $name,
            'email' => $email,
            'password' => 'password',
            'email_verified_at' => now(),
            'timezone' => 'Europe/Berlin',
            'locale' => 'en',
            'unit_preference' => 'metric',
        ]);
    }

    private function seedWorkspaceAndPeople(): void
    {
        $this->coach = $this->makeUser('Dana Cole', 'dana@trainet.test');
        $this->nutritionist = $this->makeUser('Noor Haddad', 'noor@trainet.test');
        $this->assistant = $this->makeUser('Ari Petit', 'ari@trainet.test');

        $this->workspace = Workspace::create([
            'name' => 'Peak Performance Studio',
            'type' => 'studio',
            'owner_id' => $this->coach->id,
        ]);

        ProfessionalProfile::create([
            'user_id' => $this->coach->id,
            'professional_type' => ProfessionalType::Both,
            'bio' => 'Strength & conditioning coach, 10+ years. Powerlifting specialist.',
            'credentials' => 'CSCS, PN-1',
            'business_name' => 'Peak Performance Studio',
        ]);
        ProfessionalProfile::create([
            'user_id' => $this->nutritionist->id,
            'professional_type' => ProfessionalType::Nutritionist,
            'bio' => 'Registered dietitian focused on sustainable habit change.',
            'credentials' => 'RD, MSc Nutrition',
        ]);

        foreach ([
            [$this->coach, WorkspaceMemberRole::Owner],
            [$this->nutritionist, WorkspaceMemberRole::Nutritionist],
            [$this->assistant, WorkspaceMemberRole::Assistant],
        ] as [$user, $role]) {
            WorkspaceMember::create([
                'workspace_id' => $this->workspace->id,
                'user_id' => $user->id,
                'role' => $role,
                'status' => 'active',
            ]);
        }

        $clientDefs = [
            'maya' => ['Maya Lindqvist', 'maya@trainet.test', OnboardingStatus::Complete, 'Lose 6 kg while keeping strength. Trains 3x/week.', 'intermediate'],
            'leo' => ['Leo Moreau', 'leo@trainet.test', OnboardingStatus::InProgress, null, null],
            'sam' => ['Sam Okafor', 'sam@trainet.test', OnboardingStatus::Complete, 'Get back into a routine after a busy quarter.', 'beginner'],
            'kim' => ['Kim Tanaka', 'kim@trainet.test', OnboardingStatus::Complete, 'Build strength for bouldering season.', 'intermediate'],
            'pat' => ['Pat Rivers', 'pat@trainet.test', OnboardingStatus::Complete, 'Body recomposition — lose fat, add muscle.', 'advanced'],
        ];

        $tags = [
            'vip' => ClientTag::create(['workspace_id' => $this->workspace->id, 'name' => 'VIP', 'color' => 'green']),
            'at-risk' => ClientTag::create(['workspace_id' => $this->workspace->id, 'name' => 'At risk', 'color' => 'amber']),
            'new' => ClientTag::create(['workspace_id' => $this->workspace->id, 'name' => 'New', 'color' => 'blue']),
        ];

        foreach ($clientDefs as $key => [$name, $email, $onboarding, $goals, $level]) {
            $user = $this->makeUser($name, $email);
            $profile = ClientProfile::create([
                'user_id' => $user->id,
                'onboarding_status' => $onboarding,
                'goals_summary' => $goals,
                'experience_level' => $level,
                'equipment' => $level ? ['barbell', 'dumbbell', 'bench', 'rack'] : null,
                'training_days' => $level ? [1, 3, 5] : null,
                'dietary_preferences' => $key === 'pat' ? ['high-protein'] : [],
                'allergies' => $key === 'maya' ? 'Peanuts' : null,
                'height_cm' => ['maya' => 168, 'sam' => 182, 'kim' => 165, 'pat' => 178][$key] ?? null,
                'birth_year' => ['maya' => 1992, 'sam' => 1988, 'kim' => 1996, 'pat' => 1985][$key] ?? null,
                'consent_accepted_at' => $onboarding === OnboardingStatus::Complete ? now()->subMonths(2) : null,
            ]);
            $this->clients[$key] = $profile;

            $relationship = $key === 'kim' ? RelationshipType::Trainer : RelationshipType::Trainer;
            ProfessionalClientAssignment::create([
                'workspace_id' => $this->workspace->id,
                'client_id' => $profile->id,
                'professional_id' => $this->coach->id,
                'relationship_type' => $relationship,
                'status' => AssignmentStatus::Active,
                'starts_on' => now()->subMonths(2)->toDateString(),
            ]);
            if (in_array($key, ['maya', 'pat'])) {
                ProfessionalClientAssignment::create([
                    'workspace_id' => $this->workspace->id,
                    'client_id' => $profile->id,
                    'professional_id' => $this->nutritionist->id,
                    'relationship_type' => RelationshipType::Nutritionist,
                    'status' => AssignmentStatus::Active,
                    'starts_on' => now()->subMonths(2)->toDateString(),
                ]);
            }
        }

        $this->clients['maya']->tags()->attach($tags['vip']->id);
        $this->clients['sam']->tags()->attach($tags['at-risk']->id);
        $this->clients['leo']->tags()->attach($tags['new']->id);

        ClientNote::create([
            'client_id' => $this->clients['maya']->id,
            'author_id' => $this->coach->id,
            'body' => 'Responds well to video check-ins. Prefers morning sessions. Peanut allergy — flag on nutrition plans.',
        ]);
        ClientNote::create([
            'client_id' => $this->clients['sam']->id,
            'author_id' => $this->coach->id,
            'body' => 'Travel-heavy job. Programs need hotel-gym fallbacks. Went quiet last week — follow up.',
        ]);

        foreach (['maya', 'leo', 'sam', 'kim', 'pat'] as $key) {
            NotificationPreference::create([
                'user_id' => $this->clients[$key]->user_id,
                'event_type' => 'workout_reminder',
                'channel' => 'telegram',
                'enabled' => true,
            ]);
        }
    }

    private function seedExerciseLibrary(): void
    {
        $categories = collect(['Strength', 'Conditioning', 'Mobility', 'Core'])
            ->mapWithKeys(fn ($n) => [$n => ExerciseCategory::create(['name' => $n])]);

        $muscles = collect(['Chest', 'Back', 'Quads', 'Hamstrings', 'Glutes', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Calves'])
            ->mapWithKeys(fn ($n) => [$n => MuscleGroup::create(['name' => $n])]);

        $equipment = collect(['Barbell', 'Dumbbell', 'Kettlebell', 'Bodyweight', 'Band', 'Machine', 'Cable', 'Bench'])
            ->mapWithKeys(fn ($n) => [$n => Equipment::create(['name' => $n])]);

        $defs = [
            ['Barbell Back Squat', 'Strength', 'advanced', 'squat', ['Quads', 'Glutes'], ['Barbell', 'Bench'],
                'Set the bar on your upper back, brace, squat to depth, drive through mid-foot.',
                'Knees caving in; losing brace at the bottom; heels lifting.',
                'Use a spotter or safety arms for heavy sets.'],
            ['Barbell Bench Press', 'Strength', 'intermediate', 'push', ['Chest', 'Triceps', 'Shoulders'], ['Barbell', 'Bench'],
                'Lie back, unrack, lower to mid-chest with control, press to lockout.',
                'Flaring elbows; bouncing the bar; lifting hips.',
                'Always use a spotter or safeties.'],
            ['Conventional Deadlift', 'Strength', 'advanced', 'hinge', ['Hamstrings', 'Glutes', 'Back'], ['Barbell'],
                'Set mid-foot under bar, hinge, brace, push the floor away, lock hips.',
                'Rounding the back; jerking the bar; hitching.',
                'Keep the bar close; stop if position breaks.'],
            ['Romanian Deadlift', 'Strength', 'intermediate', 'hinge', ['Hamstrings', 'Glutes'], ['Barbell'],
                'Hinge at hips with soft knees until you feel a stretch, then drive hips forward.',
                'Bending knees too much; rounding the upper back.', null],
            ['Overhead Press', 'Strength', 'intermediate', 'push', ['Shoulders', 'Triceps'], ['Barbell'],
                'Press the bar overhead from front-rack, finish with biceps by ears.',
                'Overarching the lower back; pressing around the head.', null],
            ['Barbell Row', 'Strength', 'intermediate', 'pull', ['Back', 'Biceps'], ['Barbell'],
                'Hinge ~45°, pull the bar to your lower chest, control down.',
                'Standing too upright; yanking with momentum.', null],
            ['Pull-Up', 'Strength', 'intermediate', 'pull', ['Back', 'Biceps'], ['Bodyweight'],
                'Hang from the bar, pull your chest to the bar, control the descent.',
                'Kipping; half range of motion.', null],
            ['Goblet Squat', 'Strength', 'beginner', 'squat', ['Quads', 'Glutes'], ['Dumbbell'],
                'Hold a dumbbell at chest, squat between your knees, drive up.',
                'Letting the weight pull you forward.', null],
            ['Dumbbell Bench Press', 'Strength', 'intermediate', 'push', ['Chest', 'Triceps'], ['Dumbbell', 'Bench'],
                'Press dumbbells from chest to lockout, control the path.',
                'Overstretching at the bottom; clashing the bells.', null],
            ['Dumbbell Shoulder Press', 'Strength', 'beginner', 'push', ['Shoulders', 'Triceps'], ['Dumbbell'],
                'Seated or standing, press overhead without leaning back.',
                'Flaring ribs; pressing in an arc.', null],
            ['Lateral Raise', 'Strength', 'beginner', 'push', ['Shoulders'], ['Dumbbell'],
                'Raise dumbbells out to shoulder height, lead with elbows.',
                'Using momentum; going too heavy.', null],
            ['Walking Lunge', 'Strength', 'beginner', 'lunge', ['Quads', 'Glutes'], ['Bodyweight'],
                'Step into a lunge, lower the back knee, drive through the front foot.',
                'Short stepping; knee tracking inside the foot.', null],
            ['Bulgarian Split Squat', 'Strength', 'intermediate', 'lunge', ['Quads', 'Glutes'], ['Dumbbell', 'Bench'],
                'Rear foot elevated, lower straight down, drive up through the front leg.',
                'Torso tipping forward; pushing off the back leg.', null],
            ['Hip Thrust', 'Strength', 'beginner', 'hinge', ['Glutes', 'Hamstrings'], ['Barbell', 'Bench'],
                'Upper back on bench, drive hips to full extension, squeeze glutes.',
                'Overarching at the top; partial range.', null],
            ['Leg Press', 'Strength', 'beginner', 'squat', ['Quads', 'Glutes'], ['Machine'],
                'Feet mid-platform, lower with control, press without locking knees.',
                'Bottoming out; knees collapsing in.', null],
            ['Lat Pulldown', 'Strength', 'beginner', 'pull', ['Back', 'Biceps'], ['Cable', 'Machine'],
                'Pull the bar to upper chest, lead with elbows, control up.',
                'Leaning back too far; pulling behind the neck.', null],
            ['Seated Cable Row', 'Strength', 'beginner', 'pull', ['Back', 'Biceps'], ['Cable'],
                'Pull handle to stomach, squeeze shoulder blades, control return.',
                'Rocking the torso; shrugging.', null],
            ['Face Pull', 'Strength', 'beginner', 'pull', ['Shoulders', 'Back'], ['Cable', 'Band'],
                'Pull to forehead with elbows high, rotate externally.',
                'Using too much weight; no external rotation.', null],
            ['Push-Up', 'Strength', 'beginner', 'push', ['Chest', 'Triceps', 'Core'], ['Bodyweight'],
                'Body in line, lower chest to floor, press up.',
                'Sagging hips; half reps.', null],
            ['Kettlebell Swing', 'Conditioning', 'intermediate', 'hinge', ['Glutes', 'Hamstrings', 'Core'], ['Kettlebell'],
                'Hike the bell back, snap hips forward, let it float to chest height.',
                'Squatting the swing; muscling with arms.', null],
            ['Battle Ropes', 'Conditioning', 'beginner', 'conditioning', ['Shoulders', 'Core'], ['Band'],
                'Alternate waves, stay tall, keep the pace.',
                'Standing too close; losing posture.', null],
            ['Rowing Intervals', 'Conditioning', 'beginner', 'conditioning', ['Back', 'Quads'], ['Machine'],
                'Drive legs, swing back, pull handle to ribs. Recover on the way in.',
                'Pulling with arms first; rushing the slide.', null],
            ['Plank', 'Core', 'beginner', 'core', ['Core'], ['Bodyweight'],
                'Forearms down, body in line, breathe and brace.',
                'Hips sagging or piking.', null],
            ['Dead Bug', 'Core', 'beginner', 'core', ['Core'], ['Bodyweight'],
                'Press low back to floor, extend opposite arm and leg, return.',
                'Letting the low back arch.', null],
            ['Pallof Press', 'Core', 'beginner', 'core', ['Core'], ['Band', 'Cable'],
                'Press the band straight out, resist rotation, return.',
                'Rotating with the press; leaning away.', null],
            ['Cat-Cow', 'Mobility', 'beginner', 'mobility', ['Back'], ['Bodyweight'],
                'Alternate between rounding and arching the spine, slow breaths.',
                'Rushing through reps.', null],
            ['90/90 Hip Switch', 'Mobility', 'beginner', 'mobility', ['Glutes'], ['Bodyweight'],
                'From 90/90 seated, switch legs while staying tall.',
                'Using hands to push; rounding forward.', null],
            ['World\'s Greatest Stretch', 'Mobility', 'beginner', 'mobility', ['Glutes', 'Hamstrings', 'Back'], ['Bodyweight'],
                'Lunge, elbow to instep, rotate open, step through.',
                'Rushing; front knee collapsing in.', null],
        ];

        foreach ($defs as [$name, $cat, $diff, $pattern, $mgs, $eq, $instr, $mistakes, $safety]) {
            $exercise = Exercise::create([
                'exercise_category_id' => $categories[$cat]->id,
                'name' => $name,
                'difficulty' => $diff,
                'movement_pattern' => $pattern,
                'instructions' => $instr,
                'common_mistakes' => $mistakes,
                'safety_notes' => $safety,
                'is_custom' => false,
            ]);
            $exercise->muscleGroups()->attach(collect($mgs)->map(fn ($m) => $muscles[$m]->id));
            $exercise->equipment()->attach(collect($eq)->map(fn ($e) => $equipment[$e]->id));
            $this->exercises[$name] = $exercise;
        }

        // A couple of custom workspace exercises
        foreach ([
            ['Trap Bar Deadlift (Studio)', 'Strength', 'intermediate', 'hinge', ['Hamstrings', 'Glutes', 'Quads'], ['Barbell'],
                'Trap bar deadlift — studio standard for clients with lower-back sensitivity.',
                'Letting hips shoot up early.', 'Preferred hinge pattern for beginners.'],
            ['Sled Push', 'Conditioning', 'beginner', 'push', ['Quads', 'Glutes', 'Calves'], ['Bodyweight'],
                'Drive the sled with short powerful steps, stay low.',
                'Straight arms locking early.', null],
        ] as [$name, $cat, $diff, $pattern, $mgs, $eq, $instr, $mistakes, $safety]) {
            $exercise = Exercise::create([
                'exercise_category_id' => $categories[$cat]->id,
                'workspace_id' => $this->workspace->id,
                'name' => $name,
                'difficulty' => $diff,
                'movement_pattern' => $pattern,
                'instructions' => $instr,
                'common_mistakes' => $mistakes,
                'safety_notes' => $safety,
                'is_custom' => true,
            ]);
            $exercise->muscleGroups()->attach(collect($mgs)->map(fn ($m) => $muscles[$m]->id));
            $exercise->equipment()->attach(collect($eq)->map(fn ($e) => $equipment[$e]->id));
            $this->exercises[$name] = $exercise;
        }

        // Alternatives
        $altPairs = [
            'Barbell Back Squat' => ['Goblet Squat', 'Leg Press'],
            'Barbell Bench Press' => ['Dumbbell Bench Press', 'Push-Up'],
            'Conventional Deadlift' => ['Trap Bar Deadlift (Studio)', 'Romanian Deadlift'],
            'Pull-Up' => ['Lat Pulldown'],
            'Overhead Press' => ['Dumbbell Shoulder Press'],
        ];
        foreach ($altPairs as $name => $alts) {
            foreach ($alts as $alt) {
                $this->exercises[$name]->alternatives()->attach($this->exercises[$alt]->id);
            }
        }
    }

    private function ex(string $name): Exercise
    {
        return $this->exercises[$name];
    }

    private function seedProgramsAndSessions(): void
    {
        // Program 1: Foundations Full-Body (3 days)
        $foundations = TrainingProgram::create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->coach->id,
            'name' => 'Foundations Full-Body',
            'description' => 'Three-day full-body strength program for newer lifters.',
            'status' => ContentStatus::Active,
        ]);
        $fv1 = TrainingProgramVersion::create([
            'training_program_id' => $foundations->id,
            'version_number' => 1,
            'created_by' => $this->coach->id,
            'change_summary' => 'Initial release',
            'status' => VersionStatus::Published,
            'published_at' => now()->subMonths(2),
        ]);
        $this->seedDay($fv1, 1, 'Day A — Squat focus', false, [
            ['Barbell Back Squat', 3, '8', 60, null, 7, 120],
            ['Barbell Bench Press', 3, '8', 40, null, 7, 90],
            ['Seated Cable Row', 3, '10', null, null, null, 90],
            ['Plank', 3, null, null, 45, null, 60],
        ]);
        $this->seedDay($fv1, 2, 'Rest', true, []);
        $this->seedDay($fv1, 3, 'Day B — Hinge focus', false, [
            ['Romanian Deadlift', 3, '8', 50, null, 7, 120],
            ['Overhead Press', 3, '8', 25, null, 7, 90],
            ['Lat Pulldown', 3, '10', null, null, null, 90],
            ['Dead Bug', 3, '10', null, null, null, 60],
        ]);
        $this->seedDay($fv1, 4, 'Rest', true, []);
        $this->seedDay($fv1, 5, 'Day C — Full body', false, [
            ['Goblet Squat', 3, '10', 16, null, null, 90],
            ['Push-Up', 3, '12', null, null, null, 60],
            ['Barbell Row', 3, '10', 35, null, 7, 90],
            ['Pallof Press', 3, '12', null, null, null, 60],
        ]);

        $fv2 = TrainingProgramVersion::create([
            'training_program_id' => $foundations->id,
            'version_number' => 2,
            'created_by' => $this->coach->id,
            'change_summary' => 'Added hip thrust to Day A, bumped bench volume',
            'status' => VersionStatus::Published,
            'published_at' => now()->subWeeks(3),
        ]);
        $this->seedDay($fv2, 1, 'Day A — Squat focus', false, [
            ['Barbell Back Squat', 4, '6', 65, null, 8, 150],
            ['Hip Thrust', 3, '10', 60, null, null, 90],
            ['Barbell Bench Press', 4, '6', 42.5, null, 8, 120],
            ['Seated Cable Row', 3, '10', null, null, null, 90],
            ['Plank', 3, null, null, 45, null, 60],
        ]);
        $this->seedDay($fv2, 2, 'Rest', true, []);
        $this->seedDay($fv2, 3, 'Day B — Hinge focus', false, [
            ['Romanian Deadlift', 4, '6', 60, null, 8, 150],
            ['Overhead Press', 3, '8', 27.5, null, 8, 90],
            ['Lat Pulldown', 3, '10', null, null, null, 90],
            ['Dead Bug', 3, '10', null, null, null, 60],
        ]);
        $this->seedDay($fv2, 4, 'Rest', true, []);
        $this->seedDay($fv2, 5, 'Day C — Full body', false, [
            ['Goblet Squat', 3, '10', 20, null, null, 90],
            ['Push-Up', 3, '12', null, null, null, 60],
            ['Barbell Row', 3, '10', 40, null, 8, 90],
            ['Face Pull', 3, '15', null, null, null, 60],
        ]);

        // Program 2: Strength Builder (4 days) for Kim
        $builder = TrainingProgram::create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->coach->id,
            'name' => 'Strength Builder',
            'description' => 'Four-day upper/lower split for intermediate lifters.',
            'status' => ContentStatus::Active,
        ]);
        $bv1 = TrainingProgramVersion::create([
            'training_program_id' => $builder->id,
            'version_number' => 1,
            'created_by' => $this->coach->id,
            'change_summary' => 'Initial release',
            'status' => VersionStatus::Published,
            'published_at' => now()->subMonths(2),
        ]);
        $this->seedDay($bv1, 1, 'Lower 1', false, [
            ['Barbell Back Squat', 4, '5', 80, null, 8, 180],
            ['Romanian Deadlift', 3, '8', 70, null, 8, 120],
            ['Walking Lunge', 3, '12', null, null, null, 90],
        ]);
        $this->seedDay($bv1, 2, 'Upper 1', false, [
            ['Barbell Bench Press', 4, '5', 60, null, 8, 150],
            ['Barbell Row', 4, '6', 55, null, 8, 120],
            ['Dumbbell Shoulder Press', 3, '10', 16, null, null, 90],
            ['Face Pull', 3, '15', null, null, null, 60],
        ]);
        $this->seedDay($bv1, 3, 'Rest', true, []);
        $this->seedDay($bv1, 4, 'Lower 2', false, [
            ['Trap Bar Deadlift (Studio)', 4, '5', 90, null, 8, 180],
            ['Bulgarian Split Squat', 3, '8', 12, null, null, 90],
            ['Kettlebell Swing', 4, '15', 24, null, null, 60],
        ]);
        $this->seedDay($bv1, 5, 'Upper 2', false, [
            ['Pull-Up', 4, '6', null, null, 8, 150],
            ['Overhead Press', 4, '6', 40, null, 8, 120],
            ['Dumbbell Bench Press', 3, '10', 22, null, null, 90],
            ['Lat Pulldown', 3, '12', null, null, null, 60],
        ]);

        // Draft program (unpublished) for the builder demo
        $home = TrainingProgram::create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->coach->id,
            'name' => 'At-Home Conditioning',
            'description' => 'No-equipment conditioning for travel weeks.',
            'status' => ContentStatus::Draft,
        ]);
        $hv1 = TrainingProgramVersion::create([
            'training_program_id' => $home->id,
            'version_number' => 1,
            'created_by' => $this->coach->id,
            'status' => VersionStatus::Draft,
        ]);
        $this->seedDay($hv1, 1, 'Travel Circuit', false, [
            ['Push-Up', 4, '15', null, null, null, 45],
            ['Walking Lunge', 4, '12', null, null, null, 45],
            ['Plank', 3, null, null, 60, null, 45],
        ]);

        // Assignments
        $mayaAssignment = ProgramAssignment::create([
            'workspace_id' => $this->workspace->id,
            'client_id' => $this->clients['maya']->id,
            'training_program_version_id' => $fv2->id,
            'assigned_by' => $this->coach->id,
            'starts_on' => now()->subWeeks(6)->startOfWeek()->toDateString(),
            'schedule_days' => [1 => 'A', 3 => 'B', 5 => 'C'], // weekday => day label
            'status' => AssignmentStatus::Active,
        ]);
        ProgramAssignment::create([
            'workspace_id' => $this->workspace->id,
            'client_id' => $this->clients['kim']->id,
            'training_program_version_id' => $bv1->id,
            'assigned_by' => $this->coach->id,
            'starts_on' => now()->subWeeks(4)->startOfWeek()->toDateString(),
            'schedule_days' => [1 => 1, 2 => 2, 4 => 4, 5 => 5],
            'status' => AssignmentStatus::Active,
        ]);
        $samAssignment = ProgramAssignment::create([
            'workspace_id' => $this->workspace->id,
            'client_id' => $this->clients['sam']->id,
            'training_program_version_id' => $fv1->id,
            'assigned_by' => $this->coach->id,
            'starts_on' => now()->subWeeks(5)->startOfWeek()->toDateString(),
            'schedule_days' => [1 => 'A', 3 => 'B', 5 => 'C'],
            'status' => AssignmentStatus::Active,
        ]);

        // Workout history for Maya — 5 weeks completed + this week in progress
        $days = $fv2->days->keyBy('order');
        $scheduleMap = [1 => 1, 3 => 3, 5 => 5]; // Mon=>day1 Wed=>day3 Fri=>day5
        $weeksBack = 5;
        for ($w = $weeksBack; $w >= 0; $w--) {
            $weekStart = now()->subWeeks($w)->startOfWeek();
            foreach ($scheduleMap as $weekday => $dayOrder) {
                $date = $weekStart->copy()->addDays($weekday - 1);
                if ($date->isFuture()) {
                    // Future scheduled session
                    WorkoutSession::create([
                        'program_assignment_id' => $mayaAssignment->id,
                        'client_id' => $this->clients['maya']->id,
                        'training_day_id' => $days[$dayOrder]->id,
                        'scheduled_for' => $date->toDateString(),
                        'status' => WorkoutSessionStatus::Scheduled,
                    ]);

                    continue;
                }

                $isToday = $date->isToday();
                if ($isToday) {
                    // Today's session — paused mid-way for the resume demo
                    $session = $this->createSessionFromDay(
                        $mayaAssignment,
                        $days[$dayOrder],
                        $date,
                        WorkoutSessionStatus::Paused,
                    );
                    $session->exercises->first()?->sets()->where('set_order', '>', 1)->update(['status' => 'pending', 'actual_reps' => null, 'actual_load' => null]);

                    continue;
                }

                $session = $this->createSessionFromDay(
                    $mayaAssignment,
                    $days[$dayOrder],
                    $date,
                    WorkoutSessionStatus::Completed,
                );
            }
        }

        // Personal records for Maya
        PersonalRecord::create([
            'client_id' => $this->clients['maya']->id,
            'exercise_id' => $this->ex('Barbell Back Squat')->id,
            'type' => 'max_load',
            'value' => 72.5,
            'achieved_at' => now()->subWeeks(1),
        ]);
        PersonalRecord::create([
            'client_id' => $this->clients['maya']->id,
            'exercise_id' => $this->ex('Barbell Bench Press')->id,
            'type' => 'max_load',
            'value' => 45,
            'achieved_at' => now()->subWeeks(2),
        ]);

        // Sam — recent sessions skipped (shows in attention queue)
        $samDays = $fv1->days->keyBy('order');
        foreach ([1 => 1, 3 => 3, 5 => 5] as $weekday => $dayOrder) {
            $date = now()->startOfWeek()->addDays($weekday - 1);
            WorkoutSession::create([
                'program_assignment_id' => $samAssignment->id,
                'client_id' => $this->clients['sam']->id,
                'training_day_id' => $samDays[$dayOrder]->id,
                'scheduled_for' => $date->toDateString(),
                'status' => $date->isPast() ? WorkoutSessionStatus::Skipped : WorkoutSessionStatus::Scheduled,
            ]);
            $lastWeek = $date->copy()->subWeek();
            $session = $this->createSessionFromDay($samAssignment, $samDays[$dayOrder], $lastWeek, WorkoutSessionStatus::Skipped);
            $session->exercises()->delete(); // skipped sessions carry no logged work
        }

        // Kim — a couple of recent completed sessions
        $kimDays = $bv1->days->keyBy('order');
        $kimAssignment = ProgramAssignment::where('client_id', $this->clients['kim']->id)->first();
        foreach ([1 => 1, 2 => 2, 4 => 4, 5 => 5] as $weekday => $dayOrder) {
            $date = now()->startOfWeek()->addDays($weekday - 1);
            $this->createSessionFromDay(
                $kimAssignment,
                $kimDays[$dayOrder],
                $date,
                $date->isFuture() ? WorkoutSessionStatus::Scheduled : WorkoutSessionStatus::Completed,
            );
        }
    }

    private function seedDay(TrainingProgramVersion $version, int $order, string $title, bool $rest, array $exercises): void
    {
        $day = TrainingDay::create([
            'training_program_version_id' => $version->id,
            'order' => $order,
            'title' => $title,
            'is_rest_day' => $rest,
        ]);

        foreach ($exercises as $i => [$name, $sets, $reps, $load, $duration, $rpe, $rest]) {
            TrainingDayExercise::create([
                'training_day_id' => $day->id,
                'exercise_id' => $this->ex($name)->id,
                'order' => $i + 1,
                'sets' => $sets,
                'reps' => $reps !== null ? (string) $reps : null,
                'target_load' => $load,
                'duration_seconds' => $duration,
                'rpe' => $rpe,
                'rest_seconds' => $rest,
            ]);
        }
    }

    private function createSessionFromDay(
        ProgramAssignment $assignment,
        TrainingDay $day,
        CarbonInterface $date,
        WorkoutSessionStatus $status,
    ): WorkoutSession {
        $session = WorkoutSession::create([
            'program_assignment_id' => $assignment->id,
            'client_id' => $assignment->client_id,
            'training_day_id' => $day->id,
            'scheduled_for' => $date->toDateString(),
            'status' => $status,
            'started_at' => in_array($status, [WorkoutSessionStatus::Completed, WorkoutSessionStatus::Paused, WorkoutSessionStatus::InProgress])
                ? $date->copy()->setTime(8, 30)
                : null,
            'completed_at' => $status === WorkoutSessionStatus::Completed ? $date->copy()->setTime(9, 45) : null,
            'duration_seconds' => $status === WorkoutSessionStatus::Completed ? 4500 : null,
        ]);

        foreach ($day->exercises as $dayExercise) {
            $sessionExercise = WorkoutSessionExercise::create([
                'workout_session_id' => $session->id,
                'exercise_id' => $dayExercise->exercise_id,
                'order' => $dayExercise->order,
                'group_label' => $dayExercise->group_label,
                'target_sets' => $dayExercise->sets,
                'target_reps' => $dayExercise->reps,
                'target_load' => $dayExercise->target_load,
                'target_duration_seconds' => $dayExercise->duration_seconds,
                'target_rpe' => $dayExercise->rpe,
                'rest_seconds' => $dayExercise->rest_seconds,
                'status' => $status === WorkoutSessionStatus::Completed ? WorkStatus::Done : WorkStatus::Pending,
            ]);

            $setCount = $dayExercise->sets ?? 3;
            for ($s = 1; $s <= $setCount; $s++) {
                $done = $status === WorkoutSessionStatus::Completed;
                $targetReps = (int) ($dayExercise->reps ?: 8);
                WorkoutSet::create([
                    'workout_session_exercise_id' => $sessionExercise->id,
                    'set_order' => $s,
                    'planned_reps' => $targetReps,
                    'planned_load' => $dayExercise->target_load,
                    'actual_reps' => $done ? $targetReps + fake()->numberBetween(-1, 2) : null,
                    'actual_load' => $done ? $dayExercise->target_load : null,
                    'actual_rpe' => $done ? ($dayExercise->rpe ?? fake()->randomFloat(1, 6.5, 9)) : null,
                    'status' => $done ? WorkStatus::Done : WorkStatus::Pending,
                ]);
            }
        }

        return $session;
    }

    private function seedNutrition(): void
    {
        $categories = collect(['Protein', 'Carbs', 'Vegetables', 'Fruits', 'Dairy', 'Fats', 'Snacks'])
            ->mapWithKeys(fn ($n) => [$n => FoodCategory::create(['name' => $n])]);

        // [name, category, kcal/100g, p, c, f, portions[[label, grams]]]
        $foods = [
            ['Chicken breast', 'Protein', 165, 31, 0, 3.6, [['100 g', 100], ['1 fillet (150 g)', 150]]],
            ['Salmon fillet', 'Protein', 208, 20, 0, 13, [['100 g', 100], ['1 fillet (170 g)', 170]]],
            ['Eggs', 'Protein', 143, 12.6, 0.7, 9.5, [['1 egg (55 g)', 55], ['2 eggs', 110]]],
            ['Greek yogurt 0%', 'Dairy', 59, 10, 3.6, 0.4, [['100 g', 100], ['1 cup (200 g)', 200]]],
            ['Cottage cheese', 'Dairy', 98, 11, 3.4, 4.3, [['100 g', 100], ['1 cup (220 g)', 220]]],
            ['Tofu', 'Protein', 76, 8, 1.9, 4.8, [['100 g', 100], ['1/2 block (150 g)', 150]]],
            ['Tuna (canned)', 'Protein', 116, 26, 0, 1, [['1 can drained (100 g)', 100]]],
            ['Protein powder', 'Protein', 380, 76, 8, 5, [['1 scoop (30 g)', 30]]],
            ['White rice (cooked)', 'Carbs', 130, 2.7, 28, 0.3, [['100 g', 100], ['1 cup (160 g)', 160]]],
            ['Oats', 'Carbs', 389, 16.9, 66, 6.9, [['40 g', 40], ['100 g', 100]]],
            ['Sweet potato', 'Carbs', 86, 1.6, 20, 0.1, [['100 g', 100], ['1 medium (150 g)', 150]]],
            ['Whole wheat bread', 'Carbs', 247, 13, 41, 3.4, [['1 slice (35 g)', 35], ['2 slices', 70]]],
            ['Quinoa (cooked)', 'Carbs', 120, 4.4, 21, 1.9, [['100 g', 100], ['1 cup (185 g)', 185]]],
            ['Pasta (cooked)', 'Carbs', 158, 5.8, 31, 0.9, [['100 g', 100], ['1 cup (140 g)', 140]]],
            ['Banana', 'Fruits', 89, 1.1, 23, 0.3, [['1 medium (120 g)', 120]]],
            ['Apple', 'Fruits', 52, 0.3, 14, 0.2, [['1 medium (180 g)', 180]]],
            ['Blueberries', 'Fruits', 57, 0.7, 14, 0.3, [['100 g', 100], ['1 cup (150 g)', 150]]],
            ['Orange', 'Fruits', 47, 0.9, 12, 0.1, [['1 medium (130 g)', 130]]],
            ['Broccoli', 'Vegetables', 34, 2.8, 7, 0.4, [['100 g', 100], ['1 cup (90 g)', 90]]],
            ['Spinach', 'Vegetables', 23, 2.9, 3.6, 0.4, [['100 g', 100], ['1 handful (30 g)', 30]]],
            ['Mixed salad', 'Vegetables', 17, 1.2, 3.3, 0.2, [['100 g', 100], ['1 bowl (150 g)', 150]]],
            ['Bell pepper', 'Vegetables', 26, 1, 5, 0.3, [['1 medium (120 g)', 120]]],
            ['Cucumber', 'Vegetables', 15, 0.7, 3.6, 0.1, [['100 g', 100], ['1/2 cucumber (150 g)', 150]]],
            ['Carrots', 'Vegetables', 41, 0.9, 10, 0.2, [['1 medium (60 g)', 60], ['100 g', 100]]],
            ['Avocado', 'Fats', 160, 2, 9, 15, [['1/2 avocado (75 g)', 75]]],
            ['Olive oil', 'Fats', 884, 0, 0, 100, [['1 tbsp (14 g)', 14]]],
            ['Almonds', 'Fats', 579, 21, 22, 50, [['1 handful (30 g)', 30]]],
            ['Peanut butter', 'Fats', 588, 25, 20, 50, [['1 tbsp (16 g)', 16], ['2 tbsp', 32]]],
            ['Hummus', 'Fats', 166, 8, 14, 10, [['2 tbsp (30 g)', 30]]],
            ['Dark chocolate 85%', 'Snacks', 590, 10, 22, 43, [['2 squares (20 g)', 20]]],
            ['Protein bar', 'Snacks', 350, 30, 35, 9, [['1 bar (60 g)', 60]]],
            ['Rice cakes', 'Snacks', 387, 8, 82, 2.8, [['1 cake (9 g)', 9]]],
            ['Milk 1.5%', 'Dairy', 47, 3.4, 5, 1.5, [['1 glass (250 ml)', 250]]],
            ['Mozzarella', 'Dairy', 280, 28, 3.1, 17, [['1 ball (125 g)', 125]]],
        ];

        $foodModels = [];
        foreach ($foods as [$name, $cat, $kcal, $p, $c, $f, $portions]) {
            $food = Food::create([
                'food_category_id' => $categories[$cat]->id,
                'name' => $name,
                'calories' => $kcal,
                'protein_g' => $p,
                'carbs_g' => $c,
                'fat_g' => $f,
            ]);
            foreach ($portions as [$label, $grams]) {
                FoodPortion::create(['food_id' => $food->id, 'label' => $label, 'grams' => $grams]);
            }
            $foodModels[$name] = $food;
        }

        // Nutrition plan
        $plan = NutritionPlan::create([
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->nutritionist->id,
            'name' => 'Balanced 2000 kcal',
            'description' => 'Moderate-carb baseline plan, ~140 g protein.',
            'status' => ContentStatus::Active,
        ]);
        $pv = NutritionPlanVersion::create([
            'nutrition_plan_id' => $plan->id,
            'version_number' => 1,
            'created_by' => $this->nutritionist->id,
            'change_summary' => 'Initial release',
            'status' => VersionStatus::Published,
            'published_at' => now()->subMonths(2),
        ]);
        $day = NutritionPlanDay::create(['nutrition_plan_version_id' => $pv->id, 'order' => 1, 'title' => 'Training day']);
        $meals = [
            ['Breakfast', '07:30', [
                ['Oats', 1, '40 g'], ['Greek yogurt 0%', 1, '1 cup (200 g)'], ['Blueberries', 1, '100 g'],
            ]],
            ['Lunch', '12:30', [
                ['Chicken breast', 1, '1 fillet (150 g)'], ['White rice (cooked)', 1, '1 cup (160 g)'], ['Mixed salad', 1, '1 bowl (150 g)'], ['Olive oil', 1, '1 tbsp (14 g)'],
            ]],
            ['Snack', '16:00', [
                ['Apple', 1, '1 medium (180 g)'], ['Peanut butter', 1, '1 tbsp (16 g)'],
            ]],
            ['Dinner', '19:30', [
                ['Salmon fillet', 1, '1 fillet (170 g)'], ['Sweet potato', 1, '1 medium (150 g)'], ['Broccoli', 1, '1 cup (90 g)'],
            ]],
        ];
        foreach ($meals as $i => [$name, $time, $items]) {
            $meal = Meal::create(['nutrition_plan_day_id' => $day->id, 'name' => $name, 'time_hint' => $time, 'order' => $i + 1]);
            foreach ($items as [$foodName, $qty, $portionLabel]) {
                $food = $foodModels[$foodName];
                $portion = $food->portions()->where('label', $portionLabel)->first();
                MealItem::create([
                    'meal_id' => $meal->id,
                    'food_id' => $food->id,
                    'quantity' => $qty,
                    'food_portion_id' => $portion?->id,
                ]);
            }
        }

        // Assign nutrition plan + targets to Maya & Pat
        foreach (['maya', 'pat'] as $key) {
            NutritionAssignment::create([
                'workspace_id' => $this->workspace->id,
                'client_id' => $this->clients[$key]->id,
                'nutrition_plan_version_id' => $pv->id,
                'assigned_by' => $this->nutritionist->id,
                'starts_on' => now()->subMonths(2)->toDateString(),
                'status' => AssignmentStatus::Active,
            ]);
            NutritionTarget::create([
                'client_id' => $this->clients[$key]->id,
                'source' => 'plan',
                'calories' => 2000,
                'protein_g' => 140,
                'carbs_g' => 200,
                'fat_g' => 65,
                'water_ml' => 2500,
                'starts_on' => now()->subMonths(2)->toDateString(),
            ]);
        }

        // Food logs for Maya — past 10 days, most days fully logged
        for ($d = 9; $d >= 0; $d--) {
            $date = now()->subDays($d)->toDateString();
            foreach (['Breakfast', 'Lunch', 'Dinner'] as $mealName) {
                if ($d === 0 && $mealName === 'Dinner') {
                    continue; // today: dinner not logged yet
                }
                $log = FoodLog::create([
                    'client_id' => $this->clients['maya']->id,
                    'logged_on' => $date,
                    'meal_name' => $mealName,
                ]);
                $choices = match ($mealName) {
                    'Breakfast' => [['Oats', 40], ['Greek yogurt 0%', 200], ['Banana', 120]],
                    'Lunch' => [['Chicken breast', 150], ['White rice (cooked)', 160], ['Broccoli', 90]],
                    default => [['Salmon fillet', 170], ['Sweet potato', 150], ['Mixed salad', 150]],
                };
                foreach ($choices as [$foodName, $grams]) {
                    $food = $foodModels[$foodName];
                    FoodLogItem::create([
                        'food_log_id' => $log->id,
                        'food_id' => $food->id,
                        'grams' => $grams,
                        'calories' => round($food->calories * $grams / 100),
                        'protein_g' => round($food->protein_g * $grams / 100, 1),
                        'carbs_g' => round($food->carbs_g * $grams / 100, 1),
                        'fat_g' => round($food->fat_g * $grams / 100, 1),
                        'logged_at' => Carbon::parse($date)->setTime(12, 0),
                    ]);
                }
            }
        }

        // Habits
        $habitDefs = [
            ['Drink 2.5 L water', 'Keep a bottle at your desk.'],
            ['10k steps', 'Any walking counts — commute, calls, evening walk.'],
            ['Sleep by 23:00', 'Screens off 30 min before.'],
            ['Take vitamins', 'D3 + omega-3 with breakfast.'],
        ];
        $habitModels = [];
        foreach ($habitDefs as [$name, $desc]) {
            $habitModels[$name] = Habit::create(['workspace_id' => $this->workspace->id, 'name' => $name, 'description' => $desc]);
        }
        foreach (['maya', 'pat', 'kim'] as $key) {
            foreach (['Drink 2.5 L water', '10k steps', 'Sleep by 23:00'] as $habitName) {
                $assignment = HabitAssignment::create([
                    'habit_id' => $habitModels[$habitName]->id,
                    'client_id' => $this->clients[$key]->id,
                    'frequency' => 'daily',
                    'status' => AssignmentStatus::Active,
                ]);
                for ($d = 13; $d >= 1; $d--) {
                    if (fake()->boolean(75)) {
                        HabitLog::create([
                            'habit_assignment_id' => $assignment->id,
                            'client_id' => $this->clients[$key]->id,
                            'logged_on' => now()->subDays($d)->toDateString(),
                            'completed' => true,
                        ]);
                    }
                }
            }
        }
        // Today's water for Maya
        WaterLog::create(['client_id' => $this->clients['maya']->id, 'logged_on' => today(), 'amount_ml' => 1250]);
        WaterLog::create(['client_id' => $this->clients['maya']->id, 'logged_on' => today()->subDay(), 'amount_ml' => 2600]);
    }

    private function seedProgressAndCheckIns(): void
    {
        $weight = MetricDefinition::create(['key' => 'weight', 'name' => 'Body weight', 'unit' => 'kg']);
        $waist = MetricDefinition::create(['key' => 'waist', 'name' => 'Waist', 'unit' => 'cm']);
        $bodyFat = MetricDefinition::create(['key' => 'body_fat', 'name' => 'Body fat', 'unit' => '%']);

        // Maya's weight trend — 10 weeks, 78.4 → 74.9
        $values = [78.4, 78.1, 77.6, 77.3, 76.8, 76.5, 76.1, 75.8, 75.4, 74.9];
        foreach ($values as $i => $value) {
            ClientMetricEntry::create([
                'client_id' => $this->clients['maya']->id,
                'metric_definition_id' => $weight->id,
                'value' => $value,
                'unit' => 'kg',
                'observed_on' => now()->subWeeks(10 - $i)->toDateString(),
                'source' => 'manual',
            ]);
            ClientMetricEntry::create([
                'client_id' => $this->clients['maya']->id,
                'metric_definition_id' => $waist->id,
                'value' => 82 - $i * 0.6,
                'unit' => 'cm',
                'observed_on' => now()->subWeeks(10 - $i)->toDateString(),
                'source' => 'manual',
            ]);
        }
        ClientMetricEntry::create([
            'client_id' => $this->clients['pat']->id,
            'metric_definition_id' => $weight->id,
            'value' => 84.2,
            'unit' => 'kg',
            'observed_on' => now()->subWeek()->toDateString(),
            'source' => 'manual',
        ]);

        Goal::create([
            'client_id' => $this->clients['maya']->id,
            'created_by' => $this->coach->id,
            'title' => 'Reach 72 kg',
            'metric' => 'weight',
            'start_value' => 78.4,
            'target_value' => 72,
            'unit' => 'kg',
            'due_on' => now()->addMonths(2)->toDateString(),
            'status' => GoalStatus::Active,
        ]);
        Goal::create([
            'client_id' => $this->clients['pat']->id,
            'created_by' => $this->coach->id,
            'title' => 'Squat 120 kg',
            'metric' => 'squat_1rm',
            'start_value' => 100,
            'target_value' => 120,
            'unit' => 'kg',
            'due_on' => now()->addMonths(3)->toDateString(),
            'status' => GoalStatus::Active,
        ]);

        // Placeholder progress photos (SVGs on public disk)
        foreach ([['maya', 'front', 6], ['maya', 'side', 6], ['maya', 'front', 1]] as [$key, $label, $weeksAgo]) {
            $path = "progress/{$key}-{$label}-{$weeksAgo}w.svg";
            Storage::disk('public')->put($path, $this->placeholderSvg($label));
            ProgressPhoto::create([
                'client_id' => $this->clients[$key]->id,
                'path' => $path,
                'taken_on' => now()->subWeeks($weeksAgo)->toDateString(),
                'label' => $label,
            ]);
        }

        // Check-in template
        $template = CheckInTemplate::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Weekly Check-in',
            'description' => 'Standard Friday check-in: energy, sleep, wins, blockers, adherence.',
            'status' => 'active',
        ]);
        $questions = [
            ['How was your energy this week?', 'rating', true],
            ['How did you sleep on average?', 'rating', true],
            ['How closely did you follow your training plan?', 'adherence', true],
            ['How closely did you follow your nutrition targets?', 'adherence', true],
            ['Wins this week — what went well?', 'text', true],
            ['Anything blocking progress or worth flagging?', 'text', false],
            ['Optional: add a progress photo', 'photo', false],
        ];
        $questionModels = [];
        foreach ($questions as $i => [$prompt, $type, $required]) {
            $questionModels[] = CheckInQuestion::create([
                'check_in_template_id' => $template->id,
                'order' => $i + 1,
                'prompt' => $prompt,
                'type' => $type,
                'required' => $required,
            ]);
        }

        // Schedules + submissions
        foreach (['maya', 'pat'] as $key) {
            $schedule = CheckInSchedule::create([
                'client_id' => $this->clients[$key]->id,
                'check_in_template_id' => $template->id,
                'frequency' => 'weekly',
                'weekday' => 5,
                'starts_on' => now()->subMonths(2)->toDateString(),
                'status' => 'active',
            ]);
            // 3 past reviewed submissions for maya; pat has 1 submitted + 1 pending
            $subCount = $key === 'maya' ? 3 : 1;
            for ($w = $subCount; $w >= 1; $w--) {
                $due = now()->subWeeks($w)->endOfWeek()->subDays(2)->toDateString();
                $submission = CheckInSubmission::create([
                    'check_in_schedule_id' => $schedule->id,
                    'client_id' => $this->clients[$key]->id,
                    'due_on' => $due,
                    'submitted_at' => Carbon::parse($due)->setTime(18, 0),
                    'status' => CheckInSubmissionStatus::Submitted,
                ]);
                foreach ($questionModels as $q) {
                    CheckInAnswer::create([
                        'check_in_submission_id' => $submission->id,
                        'check_in_question_id' => $q->id,
                        'value_rating' => in_array($q->type->value, ['rating', 'adherence']) ? fake()->numberBetween(3, 5) : null,
                        'value_text' => $q->type->value === 'text' ? fake()->sentence(10) : null,
                    ]);
                }
                CheckInReview::create([
                    'check_in_submission_id' => $submission->id,
                    'reviewer_id' => $this->coach->id,
                    'comment' => 'Solid week — keep protein consistent on training days.',
                    'private_note' => 'Energy dipped Thu/Fri — watch for overreach.',
                    'reviewed_at' => Carbon::parse($due)->addDay()->setTime(9, 0),
                ]);
                $submission->update(['status' => CheckInSubmissionStatus::Reviewed]);
            }
            // Current pending/due submission
            CheckInSubmission::create([
                'check_in_schedule_id' => $schedule->id,
                'client_id' => $this->clients[$key]->id,
                'due_on' => today()->toDateString(),
                'status' => CheckInSubmissionStatus::Pending,
            ]);
        }
        // Sam — one submitted, awaiting review (attention queue)
        $samSchedule = CheckInSchedule::create([
            'client_id' => $this->clients['sam']->id,
            'check_in_template_id' => $template->id,
            'frequency' => 'weekly',
            'weekday' => 5,
            'starts_on' => now()->subMonth()->toDateString(),
            'status' => 'active',
        ]);
        $samSub = CheckInSubmission::create([
            'check_in_schedule_id' => $samSchedule->id,
            'client_id' => $this->clients['sam']->id,
            'due_on' => today()->subDays(2)->toDateString(),
            'submitted_at' => today()->subDays(2)->setTime(19, 0),
            'status' => CheckInSubmissionStatus::Submitted,
        ]);
        foreach ($questionModels as $q) {
            CheckInAnswer::create([
                'check_in_submission_id' => $samSub->id,
                'check_in_question_id' => $q->id,
                'value_rating' => in_array($q->type->value, ['rating', 'adherence']) ? fake()->numberBetween(2, 4) : null,
                'value_text' => $q->type->value === 'text' ? 'Crazy work week — only got one session in.' : null,
            ]);
        }
    }

    private function seedMessaging(): void
    {
        // coach <-> maya
        $conv = Conversation::create(['workspace_id' => $this->workspace->id, 'type' => 'direct']);
        $conv->users()->attach([$this->coach->id => [], $this->clients['maya']->user_id => []]);
        $msgs = [
            [$this->coach->id, 'Great session yesterday — squats are moving well.', 3],
            [$this->clients['maya']->user_id, 'Thanks! Legs are sore today but good sore.', 3],
            [$this->coach->id, 'Keep protein steady this week, we\'ll review at the check-in.', 1],
            [$this->clients['maya']->user_id, 'Will do. Quick Q — can I swap Friday to Saturday this week?', 0],
        ];
        foreach ($msgs as [$sender, $body, $daysAgo]) {
            Message::create([
                'conversation_id' => $conv->id,
                'sender_id' => $sender,
                'body' => $body,
                'created_at' => now()->subDays($daysAgo)->setTime(9, 15),
            ]);
        }
        $conv->members()->where('user_id', $this->coach->id)->update(['last_read_at' => now()->subDay()]);
        $conv->members()->where('user_id', $this->clients['maya']->user_id)->update(['last_read_at' => now()->subDays(2)]);

        // coach <-> pat
        $conv2 = Conversation::create(['workspace_id' => $this->workspace->id, 'type' => 'direct']);
        $conv2->users()->attach([$this->coach->id => [], $this->clients['pat']->user_id => []]);
        Message::create([
            'conversation_id' => $conv2->id,
            'sender_id' => $this->clients['pat']->user_id,
            'body' => 'Check-in done for this week. Also — booking Thursday session?',
            'created_at' => now()->subHours(5),
        ]);
        Message::create([
            'conversation_id' => $conv2->id,
            'sender_id' => $this->coach->id,
            'body' => 'Reviewed — strong adherence. Thursday at 17:00 works.',
            'created_at' => now()->subHours(2),
        ]);
        $conv2->members()->where('user_id', $this->coach->id)->update(['last_read_at' => now()->subHours(3)]);

        // nutritionist <-> maya
        $conv3 = Conversation::create(['workspace_id' => $this->workspace->id, 'type' => 'direct']);
        $conv3->users()->attach([$this->nutritionist->id => [], $this->clients['maya']->user_id => []]);
        Message::create([
            'conversation_id' => $conv3->id,
            'sender_id' => $this->nutritionist->id,
            'body' => 'Logged dinners look great. Try adding a carb side post-workout.',
            'created_at' => now()->subDays(4),
        ]);
        $conv3->members()->where('user_id', $this->nutritionist->id)->update(['last_read_at' => now()]);
    }

    private function seedScheduling(): void
    {
        $consult = AppointmentType::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Check-in call',
            'duration_minutes' => 30,
            'buffer_minutes' => 15,
            'color' => 'green',
            'location_note' => 'Video call',
        ]);
        $session = AppointmentType::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'In-person session',
            'duration_minutes' => 60,
            'buffer_minutes' => 0,
            'color' => 'blue',
            'location_note' => 'Studio — Mitte',
        ]);
        AppointmentType::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Initial consult',
            'duration_minutes' => 60,
            'buffer_minutes' => 15,
            'color' => 'purple',
            'location_note' => 'Studio or video',
        ]);

        // Coach availability Mon-Fri 08:00-17:00
        foreach ([1, 2, 3, 4, 5] as $weekday) {
            AvailabilityRule::create([
                'workspace_id' => $this->workspace->id,
                'user_id' => $this->coach->id,
                'weekday' => $weekday,
                'start_time' => '08:00',
                'end_time' => '17:00',
            ]);
        }

        $mkAppt = function (string $clientKey, AppointmentType $type, CarbonInterface $start, string $status) {
            $appt = Appointment::create([
                'workspace_id' => $this->workspace->id,
                'client_id' => $this->clients[$clientKey]->id,
                'professional_id' => $this->coach->id,
                'appointment_type_id' => $type->id,
                'starts_at' => $start,
                'ends_at' => $start->copy()->addMinutes($type->duration_minutes),
                'status' => $status,
                'location_note' => $type->location_note,
            ]);
            AppointmentEvent::create([
                'appointment_id' => $appt->id,
                'actor_id' => $this->coach->id,
                'type' => 'created',
                'new_starts_at' => $start,
            ]);

            return $appt;
        };

        $mkAppt('maya', $session, now()->setTime(17, 0)->addDay(), 'confirmed');
        $mkAppt('pat', $consult, now()->addDays(3)->setTime(10, 30), 'pending');
        $mkAppt('kim', $session, now()->addDays(2)->setTime(9, 0), 'confirmed');
        $mkAppt('maya', $consult, now()->subWeek()->setTime(11, 0), 'completed')->update(['session_notes' => 'Reviewed 6-week block. Squat up 5 kg. Next: deload then volume block.']);
    }

    private function placeholderSvg(string $label): string
    {
        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d7e8df"/><stop offset="1" stop-color="#a8c9ba"/></linearGradient></defs>
  <rect width="400" height="600" fill="url(#g)"/>
  <text x="200" y="300" font-family="sans-serif" font-size="28" fill="#2d5a46" text-anchor="middle">Progress photo</text>
  <text x="200" y="340" font-family="sans-serif" font-size="18" fill="#4a7a64" text-anchor="middle">{$label}</text>
</svg>
SVG;
    }
}
