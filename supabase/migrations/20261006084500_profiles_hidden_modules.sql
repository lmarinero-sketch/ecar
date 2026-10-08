-- Módulos ocultos por usuario.
-- A diferencia de allowed_modules (lista blanca, solo para colaboradores),
-- hidden_modules es una lista negra que se aplica TAMBIÉN a administradores.
-- Permite que un admin le oculte módulos a otro admin sin quitarle el rol.
alter table public.profiles
  add column if not exists hidden_modules text[] not null default '{}';

comment on column public.profiles.hidden_modules is
  'Módulos ocultos para el usuario (aplica incluso a role=admin). Gestionado desde Gestión de Usuarios.';
