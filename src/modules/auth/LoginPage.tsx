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
import api from '@/lib/api'


export default function LoginPage() {
    const navigate = useNavigate()
    const login = useAuthStore((state) => state.login)


    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {username: '', password: '' },
    })

    async function onSubmit(data: LoginFormData) {
    try {
      const response = await api.post<{ token: string }>(
        '/api/v1/authentication/login',
        data,
      )
      const userResponse = await api.get(`/api/v1/users/findByUsername/${data.username}`, {
        headers: { Authorization: `Bearer ${response.data.token}` },
      })
      login(userResponse.data, response.data.token)
      navigate('/')
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        form.setError('password', { message: 'Usuário ou senha incorretos' })
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>OdontoCore CRM</CardTitle>
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
                      <Input placeholder="seu.usuario" {...field} />
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
    </div>
  )
    

}

