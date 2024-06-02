create table users (
    id integer primary key,
    discord_id text not null,

    username text not null,
    display_name text not null,
    avatar text not null,

    organizer boolean not null default false,
    admin boolean not null default false,

    refresh_token text not null,

    created_at timestamp not null default current_timestamp
);

create table games (
    id integer primary key,
    slug text unique not null,

    name text not null,
    summary text not null,
    description text not null,

    organizer integer not null references users(id),

    created_at timestamp not null default current_timestamp
);

create table entries (
    id integer primary key,

    game integer not null references games(id),
    user integer not null references users(id),

    priority integer not null default 0,

    created_at timestamp not null default current_timestamp
);

create table sessions (
    id integer primary key,

    sid text not null,
    sess text not null,
    user_id integer not null references users(id)
);