import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Cookies from "universal-cookie";
import { Button, buttonVariants } from "~/@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/@/components/ui/form";
import { Input } from "~/@/components/ui/input";
import { Toaster } from "~/@/components/ui/toaster";
import { cn } from "~/@/lib/utils";
import { useUserAction } from "~/hooks/useUser";

const formSchema = z.object({
  email: z.string().trim().email("Anna kelvollinen sähköpostiosoite."),
  password: z.string().min(1, "Anna salasana."),
});

export function Login() {
  const { loginUser, getMe } = useUserAction();
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const returnState = location.state as {
    from?: string;
    times?: { start: string; end: string };
    roomId?: string;
    buildingId?: string;
    floor?: number;
  } | null;
  const returnTo = returnState?.from?.startsWith("/") && !returnState.from.startsWith("//")
    ? returnState.from : "/";
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoginError("");
    await loginUser({ email: values.email, password: values.password });
    if (new Cookies().get("tilatikkiToken")) {
      await getMe();
      navigate(returnTo, { replace: true, state: returnState });
    } else {
      setLoginError("Kirjautuminen epäonnistui. Tarkista sähköposti ja salasana.");
    }
  }

  const cookies = new Cookies();
  const tilatikkiCookie = cookies.get("tilatikkiToken");

  // TODO:fix this useEffect by removing it
  useEffect(() => {
    if (tilatikkiCookie) {
      navigate(returnTo, { replace: true, state: returnState });
    }
  }, [tilatikkiCookie, navigate, returnTo, returnState]);

  return (
    <>
      <main className="container relative flex min-h-screen grow flex-col items-center justify-center p-6 md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <Link
          to="/register"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "absolute right-4 top-4 md:right-8 md:top-8",
          )}
        >
          Rekisteröidy
        </Link>
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-neutral-900" />
          <h1 className='z-20 font-["Archivo"] text-4xl font-black'>
            TilaTikki
          </h1>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;Varaa Opetustila Helposti.&rdquo;
              </p>
              <footer className="text-sm">Helsingin kaupunki</footer>
            </blockquote>
          </div>
        </div>

        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Kirjaudu Sisään
              </h1>
              <p className="text-sm text-muted-foreground">
                Tilavarausjärjestelmä opetustiloille.
              </p>
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-2"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sähköposti</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="etunimi.sukunimi@hel.fi"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salasana</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="virittamo"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {loginError && <p role="alert" className="text-sm text-destructive">{loginError}</p>}
                <Button disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4 animate-spin"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  )}
                  Kirjaudu Sisään
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </main>
      <Toaster />
    </>
  );
}
