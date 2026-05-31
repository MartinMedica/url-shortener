import { useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, Check, Copy, Link, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ShortenerAppProps = {
  apiUrl: string;
};

type ShortenResponse = {
  shortUrl?: string;
  error?: string;
};

export default function ShortenerApp({ apiUrl }: ShortenerAppProps) {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copiar");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setShortUrl("");
    setCopyLabel("Copiar");
    setIsLoading(true);

    try {
      const res = await fetch(`${apiUrl}/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = (await res.json()) as ShortenResponse;

      if (!res.ok) {
        throw new Error(data.error || "No se pudo acortar la URL");
      }

      if (!data.shortUrl) {
        throw new Error("La respuesta no incluyo una URL corta");
      }

      setShortUrl(data.shortUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrio un error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shortUrl);
    setCopyLabel("Copiado");

    window.setTimeout(() => {
      setCopyLabel("Copiar");
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-indigo-50 px-5 py-6 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-center gap-10 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="max-w-xl">
          <h1 className="text-5xl font-black leading-[0.95] tracking-normal text-foreground sm:text-7xl">
            Acortador de URLs
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
            Convierte enlaces largos en URLs limpias, rapidas y faciles de
            compartir.
          </p>
        </section>

        <Card className="border-white bg-card shadow-2xl shadow-cyan-950/18">
          <CardHeader>
            <CardTitle className="text-2xl">Crear enlace corto</CardTitle>
            <CardDescription>
              Pega una URL completa para generar una version lista para usar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-foreground"
                  htmlFor="url-input"
                >
                  URL original
                </label>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Input
                    id="url-input"
                    className="h-12 bg-background text-base"
                    name="url"
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://example.com"
                    required
                    type="url"
                    value={url}
                  />
                  <Button
                    className="h-12 px-6 text-base font-bold sm:min-w-36"
                    disabled={isLoading}
                    type="submit"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Acortando
                      </>
                    ) : (
                      <>
                        <Link />
                        Acortar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {error ? (
              <Alert className="mt-4" variant="destructive">
                <AlertCircle />
                <AlertTitle>No se pudo acortar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {shortUrl ? (
              <Alert className="mt-4 border-primary/20 bg-accent">
                <Check />
                <AlertTitle>URL corta</AlertTitle>
                <AlertDescription>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <a
                      className="block min-w-0 overflow-hidden text-ellipsis font-semibold text-foreground underline decoration-primary/30 underline-offset-4"
                      href={shortUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {shortUrl}
                    </a>
                    <Button
                      className="sm:min-w-28"
                      onClick={handleCopy}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      <Copy />
                      {copyLabel}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
