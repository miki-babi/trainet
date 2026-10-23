<?php

namespace Database\Seeders;

use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\ExerciseCategory;
use App\Models\ExerciseMedia;
use App\Models\Food;
use App\Models\FoodCategory;
use App\Models\FoodPortion;
use App\Models\MetricDefinition;
use App\Models\MuscleGroup;
use Illuminate\Database\Seeder;

/**
 * Seeds the shared catalog data real users need — exercise library,
 * food database, and metric definitions. Runs in every environment;
 * DemoSeeder builds personas and sample data on top of it.
 */
class ReferenceSeeder extends Seeder
{
    /** @var array<string, Exercise> */
    private array $exercises = [];

    public function run(): void
    {
        $this->seedExerciseLibrary();
        $this->seedFoodCatalog();
        $this->seedMetricDefinitions();
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

        $altPairs = [
            'Barbell Back Squat' => ['Goblet Squat', 'Leg Press'],
            'Barbell Bench Press' => ['Dumbbell Bench Press', 'Push-Up'],
            'Conventional Deadlift' => ['Romanian Deadlift'],
            'Pull-Up' => ['Lat Pulldown'],
            'Overhead Press' => ['Dumbbell Shoulder Press'],
        ];
        foreach ($altPairs as $name => $alts) {
            foreach ($alts as $alt) {
                $this->exercises[$name]->alternatives()->attach($this->exercises[$alt]->id);
            }
        }

        $images = [
            'push' => 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=70',
            'pull' => 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=400&q=70',
            'squat' => 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=70',
            'hinge' => 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=400&q=70',
            'lunge' => 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=400&q=70',
            'core' => 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=70',
            'mobility' => 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=70',
            'conditioning' => 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=70',
        ];
        $fallback = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=70';
        foreach ($this->exercises as $exercise) {
            ExerciseMedia::create([
                'exercise_id' => $exercise->id,
                'type' => 'image',
                'path' => $images[$exercise->movement_pattern] ?? $fallback,
            ]);
        }
    }

    private function seedFoodCatalog(): void
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

        $foodImages = [
            'Chicken breast' => 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=70',
            'Salmon fillet' => 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=70',
            'Eggs' => 'https://images.unsplash.com/photo-1506976785307-18a9fe5e0cde?auto=format&fit=crop&w=400&q=70',
            'Greek yogurt 0%' => 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=70',
            'Cottage cheese' => 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=70',
            'Tofu' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=70',
            'Tuna (canned)' => 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=400&q=70',
            'Protein powder' => 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=400&q=70',
            'White rice (cooked)' => 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=400&q=70',
            'Oats' => 'https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?auto=format&fit=crop&w=400&q=70',
            'Sweet potato' => 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=400&q=70',
            'Whole wheat bread' => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=70',
            'Quinoa (cooked)' => 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=70',
            'Pasta (cooked)' => 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=400&q=70',
            'Banana' => 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=70',
            'Apple' => 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=400&q=70',
            'Blueberries' => 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=400&q=70',
            'Orange' => 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=400&q=70',
            'Broccoli' => 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=400&q=70',
            'Spinach' => 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&q=70',
            'Mixed salad' => 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=70',
            'Bell pepper' => 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=400&q=70',
            'Cucumber' => 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=400&q=70',
            'Carrots' => 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&q=70',
            'Avocado' => 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=400&q=70',
            'Olive oil' => 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=70',
            'Almonds' => 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=400&q=70',
            'Peanut butter' => 'https://images.unsplash.com/photo-1583802979149-4adfa3db5b9f?auto=format&fit=crop&w=400&q=70',
            'Hummus' => 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=400&q=70',
            'Dark chocolate 85%' => 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=400&q=70',
            'Protein bar' => 'https://images.unsplash.com/photo-1571770003964-5e5c37b5e4ea?auto=format&fit=crop&w=400&q=70',
            'Rice cakes' => 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=70',
            'Milk 1.5%' => 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=70',
            'Mozzarella' => 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=400&q=70',
        ];

        foreach ($foods as [$name, $cat, $kcal, $p, $c, $f, $portions]) {
            $food = Food::create([
                'food_category_id' => $categories[$cat]->id,
                'name' => $name,
                'calories' => $kcal,
                'protein_g' => $p,
                'carbs_g' => $c,
                'fat_g' => $f,
                'image_url' => $foodImages[$name] ?? null,
            ]);
            foreach ($portions as [$label, $grams]) {
                FoodPortion::create(['food_id' => $food->id, 'label' => $label, 'grams' => $grams]);
            }
        }
    }

    private function seedMetricDefinitions(): void
    {
        MetricDefinition::create(['key' => 'weight', 'name' => 'Body weight', 'unit' => 'kg']);
        MetricDefinition::create(['key' => 'waist', 'name' => 'Waist', 'unit' => 'cm']);
        MetricDefinition::create(['key' => 'body_fat', 'name' => 'Body fat', 'unit' => '%']);
    }
}
