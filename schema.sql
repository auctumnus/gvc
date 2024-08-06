create table users (
    id integer primary key,
    discord_id text not null,

    username text not null,
    display_name text not null,
    avatar text not null,

    organizer boolean not null default false,
    admin boolean not null default false,

    refresh_token text not null,

    created_at integer not null default (unixepoch())
);

create table games (
    id integer primary key,
    slug text unique not null,

    name text not null,
    summary text not null default '',
    description text not null default '',

    min_players integer default 0,
    max_players integer default 10,

    content_warnings text default '',
    custom_content_warnings text default '',

    organizer integer not null,

    created_at integer not null default (unixepoch()),


    foreign key(organizer) references users(id) on delete cascade
);

create table game_times (
    id integer primary key,

    game integer not null,
    start integer not null,
    end integer not null,

    created_at integer not null default (unixepoch()),

    foreign key(game) references games(id) on delete cascade
);

create table entries (
    id integer primary key,

    game_time integer not null,
    user integer not null,

    priority integer not null default 0,
    accepted boolean not null default false,

    created_at integer not null default (unixepoch()),


    foreign key(game_time) references game_times(id) on delete cascade,
    foreign key(user) references users(id) on delete cascade
);

create table sessions (
    id integer primary key,

    sid text not null,
    sess text not null,
    user_id integer not null,

    created_at integer not null default (unixepoch()),

    foreign key(user_id) references users(id) on delete cascade
);