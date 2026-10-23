import { Form, Head } from '@inertiajs/react';
import { Dumbbell, UserRound } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

type AccountType = 'client' | 'professional';

export default function Register({ passwordRules }: Props) {
    const [accountType, setAccountType] = useState<AccountType>('client');
    const [professionalType, setProfessionalType] = useState('trainer');

    return (
        <>
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <input
                                type="hidden"
                                name="account_type"
                                value={accountType}
                            />
                            <input
                                type="hidden"
                                name="professional_type"
                                value={professionalType}
                            />

                            <div className="grid gap-2">
                                <Label>I want to</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAccountType('client')}
                                        aria-pressed={accountType === 'client'}
                                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm transition ${
                                            accountType === 'client'
                                                ? 'border-primary bg-primary/10 font-medium text-primary'
                                                : 'border-border text-muted-foreground hover:border-primary/50'
                                        }`}
                                    >
                                        <UserRound className="size-5" />
                                        Get coached
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setAccountType('professional')
                                        }
                                        aria-pressed={
                                            accountType === 'professional'
                                        }
                                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm transition ${
                                            accountType === 'professional'
                                                ? 'border-primary bg-primary/10 font-medium text-primary'
                                                : 'border-border text-muted-foreground hover:border-primary/50'
                                        }`}
                                    >
                                        <Dumbbell className="size-5" />
                                        Coach clients
                                    </button>
                                </div>
                                <InputError message={errors.account_type} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {accountType === 'professional' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="business_name">
                                            Business or coach name
                                        </Label>
                                        <Input
                                            id="business_name"
                                            type="text"
                                            required
                                            tabIndex={3}
                                            name="business_name"
                                            placeholder="e.g. Peak Performance Studio"
                                        />
                                        <InputError
                                            message={errors.business_name}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="professional_type">
                                            Professional type
                                        </Label>
                                        <Select
                                            value={professionalType}
                                            onValueChange={
                                                setProfessionalType
                                            }
                                        >
                                            <SelectTrigger
                                                id="professional_type"
                                                tabIndex={4}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="trainer">
                                                    Trainer
                                                </SelectItem>
                                                <SelectItem value="nutritionist">
                                                    Nutritionist
                                                </SelectItem>
                                                <SelectItem value="both">
                                                    Both
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Your profile goes live in the
                                            marketplace after a platform admin
                                            approves it.
                                        </p>
                                        <InputError
                                            message={errors.professional_type}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={6}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 h-12 w-full rounded-xl text-base"
                                tabIndex={7}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={8}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
