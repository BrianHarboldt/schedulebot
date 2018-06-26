CREATE SCHEMA public;

CREATE TABLE public.config
(
    id TEXT PRIMARY KEY NOT NULL,
    value TEXT
);

CREATE TABLE public.admins
(
    userid TEXT PRIMARY KEY NOT NULL,
    name TEXT
);

CREATE TABLE public.blacklist
(
    userid TEXT PRIMARY KEY NOT NULL,
    name TEXT
);
