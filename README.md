# HazeClub

Rede social mobile estilo Instagram + X, construida com React Native (Expo) e Supabase self-hosted.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native + Expo SDK 54 |
| Backend | Supabase self-hosted (Docker) |
| Database | PostgreSQL |
| Storage | Supabase Storage (local) |
| Auth | Supabase Auth (JWT) |

## Funcionalidades

- Cadastro e login com email/senha
- Feed de posts com scroll infinito e pull-to-refresh
- Criar post com texto e/ou imagem (galeria ou camera)
- Curtir e descurtir posts (com haptic feedback)
- Comentar em posts
- Perfil do usuario com avatar, bio e lista de posts
- Editar perfil (nome, bio, foto)
- Buscar usuarios por nome ou username
- Upload de imagens com compressao automatica (JPEG, max 1080px)
- Imagens hospedadas localmente no servidor (Supabase Storage)
- Dark theme com design glassmorphism

## Estrutura

```
src/
  context/       # AuthContext (estado global de autenticacao)
  components/    # Componentes reutilizaveis (Avatar, Button, Input, PostCard)
  hooks/         # useAuth
  navigation/    # RootNavigator, AuthStack, AppStack
  screens/
    auth/        # Login, Register
    feed/        # Feed principal
    post/        # Criar post, Detalhe do post
    profile/     # Perfil, Editar perfil
    search/      # Buscar usuarios
  services/      # Supabase client, posts API, image upload
  theme/         # Cores, spacing, tipografia
```

## Setup

### Pre-requisitos

- Node.js >= 18
- Docker e Docker Compose
- Expo Go no celular (iOS/Android)

### Backend (Supabase)

```bash
cd supabase-docker/docker
cp .env.example .env
# Editar .env com seus secrets (JWT_SECRET, POSTGRES_PASSWORD, etc)
docker compose up -d
```

Aplicar o schema do banco:

```bash
docker exec -i supabase-db psql -U supabase_admin -d postgres < supabase-schema.sql
```

### App

```bash
npm install
npx expo start --port 8082
```

Escanear o QR code com Expo Go.

### Configuracao

Editar `src/services/supabase.js` com a URL e ANON_KEY do seu Supabase:

```js
const SUPABASE_URL = 'http://SEU_IP:8000';
const SUPABASE_ANON_KEY = 'sua-anon-key';
```

Editar `src/services/image.js` com a mesma URL.

## Database Schema

- **profiles** - id, username, display_name, avatar_url, bio
- **posts** - id, user_id, content, image_url
- **likes** - post_id, user_id (unique)
- **comments** - post_id, user_id, content
- **Storage buckets** - `avatars` e `posts` (publicos)
- Row Level Security (RLS) em todas as tabelas

## License

MIT
