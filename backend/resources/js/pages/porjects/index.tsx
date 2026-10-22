
import { Head, useForm } from '@inertiajs/react';

type Project = {
    id: number;
    name: string;
    industry: string | null;
    description: string | null;
    status: 'active' | 'completed' | 'on_hold';
    created_at: string;
};

type Props = {
    projects: Project[];
};

export default function ProjectsIndex({ projects }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        industry: '',
        description: '',
        status: 'active' as Project['status'],
    });

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        post('/projects', {
            onSuccess: () => reset(),
        });
    }

    return (
        <>
            <Head title="Projects" />

            <main className="min-h-screen bg-[#111310] px-6 py-10 text-[#eeefe8] md:px-12">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-10 border-b border-white/10 pb-6">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
                            INDUSTRI BANGET / WORKSPACE
                        </p>
                        <h1 className="text-4xl font-bold tracking-tight">
                            Projects<span className="text-yellow-400">.</span>
                        </h1>
                        <p className="mt-3 text-sm text-neutral-400">
                            Kelola proyek dan analisis teknik industri dalam satu tempat.
                        </p>
                    </header>

                    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
                        <section className="h-fit border border-white/10 bg-[#191b17] p-6">
                            <h2 className="mb-5 text-lg font-semibold">
                                + Proyek Baru
                            </h2>

                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="mb-2 block text-sm">
                                        Nama proyek *
                                    </label>
                                    <input
                                        id="name"
                                        value={data.name}
                                        onChange={(event) =>
                                            setData('name', event.target.value)
                                        }
                                        className="w-full border border-white/15 bg-[#111310] px-3 py-2 outline-none focus:border-yellow-400"
                                        placeholder="Contoh: Optimasi Persediaan"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-400">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="industry" className="mb-2 block text-sm">
                                        Bidang industri
                                    </label>
                                    <input
                                        id="industry"
                                        value={data.industry}
                                        onChange={(event) =>
                                            setData('industry', event.target.value)
                                        }
                                        className="w-full border border-white/15 bg-[#111310] px-3 py-2 outline-none focus:border-yellow-400"
                                        placeholder="Manufaktur, logistik, dan lainnya"
                                    />
                                    {errors.industry && (
                                        <p className="mt-1 text-sm text-red-400">
                                            {errors.industry}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="description" className="mb-2 block text-sm">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(event) =>
                                            setData('description', event.target.value)
                                        }
                                        className="min-h-24 w-full border border-white/15 bg-[#111310] px-3 py-2 outline-none focus:border-yellow-400"
                                        placeholder="Tujuan dan ruang lingkup proyek..."
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-400">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="status" className="mb-2 block text-sm">
                                        Status
                                    </label>
                                    <select
                                        id="status"
                                        value={data.status}
                                        onChange={(event) =>
                                            setData(
                                                'status',
                                                event.target.value as Project['status'],
                                            )
                                        }
                                        className="w-full border border-white/15 bg-[#111310] px-3 py-2"
                                    >
                                        <option value="active">Aktif</option>
                                        <option value="completed">Selesai</option>
                                        <option value="on_hold">Ditunda</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-yellow-400 px-4 py-3 font-bold text-black hover:bg-yellow-300 disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Proyek →'}
                                </button>
                            </form>
                        </section>

                        <section>
                            <div className="mb-5 flex items-center justify-between">
                                <h2 className="text-xl font-semibold">
                                    Daftar Proyek
                                </h2>
                                <span className="text-sm text-neutral-400">
                                    {projects.length} proyek
                                </span>
                            </div>

                            {projects.length === 0 ? (
                                <div className="border border-dashed border-white/15 px-6 py-16 text-center">
                                    <p className="text-neutral-300">
                                        Belum ada proyek.
                                    </p>
                                    <p className="mt-2 text-sm text-neutral-500">
                                        Buat proyek pertama lewat formulir di samping.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {projects.map((project) => (
                                        <article
                                            key={project.id}
                                            className="border border-white/10 bg-[#191b17] p-5"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-lg font-semibold">
                                                        {project.name}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-neutral-400">
                                                        {project.industry || 'Bidang belum ditentukan'}
                                                    </p>
                                                </div>

                                                <span className="border border-yellow-400/30 px-2 py-1 text-xs uppercase text-yellow-300">
                                                    {project.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {project.description && (
                                                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-300">
                                                    {project.description}
                                                </p>
                                            )}

                                            <p className="mt-4 text-xs text-neutral-500">
                                                Dibuat: {project.created_at}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </>
    );
}
