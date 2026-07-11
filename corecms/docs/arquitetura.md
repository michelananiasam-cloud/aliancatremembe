Documento de Arquitetura – Fase 1
Projeto CoreCMS

Versão: 0.1.0

1. Objetivo

Criar uma plataforma web modular, baseada em HTML, CSS e JavaScript, utilizando o Supabase como backend principal.

O sistema deverá ser capaz de atender diversos tipos de projetos sem alterar sua estrutura principal, apenas adicionando módulos e configurações.

2. Filosofia do Projeto

O CoreCMS não conhece nenhum projeto específico.

Ele não sabe o que é:

Pocket Terço
Secretaria
Eventos
Cursos
Restaurante
Landing Page

Ele conhece apenas conceitos genéricos como:

Página
Componente
Layout
Usuário
Permissão
Configuração
Módulo

Toda a lógica específica ficará em módulos.

3. Tecnologias

Frontend:

HTML5
CSS3
JavaScript ES Modules

Backend:

Supabase
PostgreSQL
Storage
Auth
Realtime (opcional)

Hospedagem:

GitHub Pages
4. Estrutura Inicial
corecms/

│
├── index.html
│
├── css/
│   ├── app.css
│   ├── variables.css
│   └── components.css
│
├── js/
│   ├── app.js
│   ├── router.js
│   ├── supabase.js
│   ├── auth.js
│   ├── cache.js
│   ├── loader.js
│   └── utils.js
│
├── components/
│
├── layouts/
│
├── modules/
│
├── assets/
│   ├── img/
│   ├── icons/
│   └── fonts/
│
├── config/
│   ├── config.js
│   └── routes.js
│
└── docs/
5. Responsabilidade de cada pasta
css/

Contém todo o estilo do sistema.

Exemplo:

variables.css

cores

fontes

espaçamentos
components.css

botões

cards

inputs

menus
app.css

layout geral

responsividade

tema
js/

Contém a Engine.

Nenhum módulo será colocado aqui.

app.js

Ponto de entrada do sistema.

Responsável por iniciar toda a aplicação.

router.js

Responsável por:

/

/login

/home

/eventos

/cursos
supabase.js

Conexão única com o Supabase.

auth.js

Login

Logout

Sessão

Usuário atual

cache.js

Gerenciamento de cache.

loader.js

Carregamento dinâmico dos componentes.

utils.js

Funções auxiliares.

6. components/

Biblioteca de componentes reutilizáveis.

Exemplo futuro:

Button

Card

Table

Modal

Form

Input

Alert

Banner

Timeline
7. layouts/

Layouts reutilizáveis.

Exemplo:

Default

Admin

Landing

Login

Dashboard
8. modules/

Cada sistema ficará isolado.

Exemplo:

PocketTerco/

Eventos/

Secretaria/

Cursos/

Restaurante/

Cada módulo poderá possuir:

pages

components

services

database

config
9. assets/

Arquivos estáticos.

imagens

ícones

fontes

logos
10. config/

Configurações globais.

Exemplo:

Nome da aplicação

Tema

Idioma

Versão

Módulos ativos
11. docs/

Toda documentação ficará aqui.

Arquitetura

Banco

API

Roadmap

Padrões

12. Fluxo de Inicialização

Quando o navegador abrir o sistema:

index.html

↓

app.js

↓

config.js

↓

supabase.js

↓

auth.js

↓

router.js

↓

layout

↓

componentes

↓

página
13. Objetivos da Fase 1

Ao final desta fase, o sistema deverá:

possuir uma arquitetura organizada;
conectar-se ao Supabase;
inicializar corretamente;
carregar configurações básicas;
estar preparado para receber módulos.

Nenhuma funcionalidade de negócio será implementada nesta etapa.

Próxima fase

Na Fase 2, começaremos a modelar o banco de dados do CoreCMS (usuários, páginas, componentes, layouts, menus, permissões e configurações), criando uma base que servirá para qualquer projeto que você desenvolver.

Acredito que, se seguirmos essa documentação como guia, teremos uma plataforma muito organizada, escalável e reutilizável, sem precisar reestruturar tudo a cada novo sistema.
