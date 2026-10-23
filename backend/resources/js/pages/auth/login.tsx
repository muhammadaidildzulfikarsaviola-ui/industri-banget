import { Head, useForm } from '@inertiajs/react';
import { ThemeToggle } from '@/components/theme-toggle';

type LoginForm = {
    email: string;
    password: string;
};

export default function Login() {
    const { data, setData, post, processing, errors } = useForm<LoginForm>({
        email: '',
        password: '',
    });

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        post('/login');
    }

    return (
        <>
            <Head title="Masuk | INDUSTRI BANGET" />
            <main className="min-h-screen bg-canvas px-4 py-6 text-ink sm:px-6 sm:py-10">
                <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
                    <header className="flex items-center justify-between border-b border-line pb-5">
                        <a href="/login" className="flex items-center gap-3">
                            <span className="flex size-11 items-center justify-center bg-accent font-black text-ink">
                                IB
                            </span>
                            <span>
                                <span className="block text-base font-bold tracking-wide">
                                    INDUSTRI BANGET
                                </span>
                                <span className="mt-1 block text-xs font-medium tracking-[0.12em] text-muted">
                                    ENGINEERING WORKSPACE
                                </span>
                            </span>
                        </a>
                        <ThemeToggle />
                    </header>

                    <div className="flex flex-1 items-center justify-center py-12">
                        <section className="grid w-full max-w-4xl border border-line bg-surface md:grid-cols-[1.05fr_0.95fr]">
                            <div className="hidden border-r border-line p-10 md:flex md:flex-col md:justify-between lg:p-12">
                                <div>
                                    <p className="font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                                        ENGINEERING · DATA · DECISIONS
                                    </p>
                                    <h1 className="mt-5 text-4xl leading-tight font-semibold tracking-tight">
                                        Ruang kerja analisis teknik industri.
                                    </h1>
                                    <p className="mt-5 text-base leading-7 text-muted">
                                        Kelola proyek dan tinjau analisis
                                        persediaan, peramalan, produksi, serta
                                        kualitas dalam satu workspace.
                                    </p>
                                </div>
                                <p className="font-mono text-xs tracking-[0.12em] text-subtle">
                                    PRIVATE WORKSPACE / AUTHENTICATED ACCESS
                                </p>
                            </div>

                            <div className="p-6 sm:p-9 lg:p-12">
                                <p className="font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                                    WORKSPACE ACCESS
                                </p>
                                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                                    Masuk
                                </h2>
                                <p className="mt-3 text-base leading-7 text-muted">
                                    Gunakan akun workspace yang telah disiapkan
                                    administrator.
                                </p>

                                <form
                                    onSubmit={submit}
                                    className="mt-8 space-y-5"
                                >
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="mb-2 block text-sm font-semibold"
                                        >
                                            Email
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="username"
                                            autoFocus
                                            required
                                            value={data.email}
                                            onChange={(event) =>
                                                setData(
                                                    'email',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(errors.email)}
                                            aria-describedby={
                                                errors.email
                                                    ? 'email-error'
                                                    : undefined
                                            }
                                            className="min-h-12 w-full border border-line-strong bg-canvas px-3 text-base text-ink placeholder:text-subtle focus:border-accent-strong focus:outline-2 focus:outline-offset-2 focus:outline-accent"
                                            placeholder="nama@perusahaan.com"
                                        />
                                        {errors.email && (
                                            <p
                                                id="email-error"
                                                role="alert"
                                                className="mt-2 text-sm font-medium text-danger"
                                            >
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="password"
                                            className="mb-2 block text-sm font-semibold"
                                        >
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="current-password"
                                            required
                                            value={data.password}
                                            onChange={(event) =>
                                                setData(
                                                    'password',
                                                    event.target.value,
                                                )
                                            }
                                            aria-invalid={Boolean(
                                                errors.password,
                                            )}
                                            aria-describedby={
                                                errors.password
                                                    ? 'password-error'
                                                    : undefined
                                            }
                                            className="min-h-12 w-full border border-line-strong bg-canvas px-3 text-base text-ink focus:border-accent-strong focus:outline-2 focus:outline-offset-2 focus:outline-accent"
                                        />
                                        {errors.password && (
                                            <p
                                                id="password-error"
                                                role="alert"
                                                className="mt-2 text-sm font-medium text-danger"
                                            >
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex min-h-12 w-full items-center justify-center border border-line-strong bg-accent px-4 text-base font-semibold text-ink transition-colors hover:bg-accent-strong hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processing
                                            ? 'Memeriksa…'
                                            : 'Masuk ke workspace'}
                                    </button>
                                </form>
                                <p className="mt-6 border-t border-line pt-5 text-sm leading-6 text-muted">
                                    Akses akun dikelola oleh administrator.
                                    Registrasi publik tidak tersedia.
                                </p>
                            </div>
                        </section>
                    </div>

                    <footer className="border-t border-line pt-4 text-sm text-subtle">
                        INDUSTRI BANGET © 2026
                    </footer>
                </div>
            </main>
        </>
    );
}
