import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { loginSchema, type LoginFormData} from './login.schema'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authService } from './auth.service'
import { usersService } from '@/modules/identity/users.service'
import type { User } from '@/types/models'
import { Role } from '@/types/enums'

function getDefaultRoute(user: User): string {
  switch (user.role) {
    case Role.ADM_SYSTEM:
      return '/'
    case Role.ADM_LEADS:
    case Role.USER_LEADS:
    case Role.ADM_EVALUATOR:
    case Role.USER_EVALUATOR:
      return '/funnel'
    case Role.USER_ATTENDANT:
      return '/customers'
    case Role.ADM_COMMERCIAL:
    case Role.USER_COMMERCIAL:
      return '/commercial'
    default:
      return '/'
  }
}

export default function LoginPage() {
    const navigate = useNavigate()
    const login = useAuthStore((state) => state.login)


    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {username: '', password: '' },
    })

    async function onSubmit(data: LoginFormData) {
      try {
        const authData = await authService.login(data.username, data.password)

        login(null, authData.token)

        const userData = await usersService.findByUsername(data.username)

        login(userData, authData.token)
        navigate(getDefaultRoute(userData))
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          if (status === 401 || status === 403) {
            form.setError('password', { message: 'Usuário ou senha incorretos' })
          } else {
            form.setError('password', { message: 'Erro ao conectar com o servidor' })
          }
        }
      }
    }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4 gap-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-brand text-brand-foreground text-sm font-black tracking-tighter leading-none">
            OC
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl tracking-tight">OdontoCore CRM</CardTitle>
            <p className="text-sm text-muted-foreground">
              Entre com suas credenciais para acessar.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="Usuário" {...field} />
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
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground/70">Desenvolvido por SertãoBit</p>
    </div>
  )
}

