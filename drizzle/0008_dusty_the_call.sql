CREATE TABLE `workspaceInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('ADMIN','USER') NOT NULL DEFAULT 'USER',
	`token` varchar(64) NOT NULL,
	`status` enum('PENDENTE','ACEITO','EXPIRADO') NOT NULL DEFAULT 'PENDENTE',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspaceInvites_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaceInvites_token_unique` UNIQUE(`token`)
);
