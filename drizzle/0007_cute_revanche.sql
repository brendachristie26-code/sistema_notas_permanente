CREATE TABLE `workspaceMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`role` enum('OWNER','ADMIN','USER') NOT NULL DEFAULT 'USER',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaceMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_workspace_unique` UNIQUE(`userId`,`workspaceId`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slugUrl` varchar(100) NOT NULL,
	`logoUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaces_slugUrl_unique` UNIQUE(`slugUrl`)
);
--> statement-breakpoint
ALTER TABLE `agentes` DROP INDEX `agentes_email_unique`;--> statement-breakpoint
ALTER TABLE `notasFiscais` DROP INDEX `notasFiscais_numero_unique`;--> statement-breakpoint
ALTER TABLE `orcamentos` DROP INDEX `orcamentos_numero_unique`;--> statement-breakpoint
ALTER TABLE `orcamentos` DROP INDEX `orcamentos_scheduleCronTaskUid_unique`;--> statement-breakpoint
ALTER TABLE `pagamentos` DROP INDEX `pagamentos_scheduleCronTaskUid_unique`;--> statement-breakpoint
ALTER TABLE `agentes` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `auditLog` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `configuracoes` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `despesas` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `notasFiscais` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `orcamentos` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `pagamentos` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `produtos` ADD `workspaceId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `configuracoes` ADD CONSTRAINT `configuracoes_workspaceId_unique` UNIQUE(`workspaceId`);