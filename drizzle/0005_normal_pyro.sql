ALTER TABLE `orcamentos` ADD `tokenPublico` varchar(64);--> statement-breakpoint
ALTER TABLE `orcamentos` ADD CONSTRAINT `orcamentos_tokenPublico_unique` UNIQUE(`tokenPublico`);