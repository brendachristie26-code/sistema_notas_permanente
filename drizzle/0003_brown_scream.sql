ALTER TABLE `orcamentos` ADD `scheduleCronTaskUid` varchar(65);--> statement-breakpoint
ALTER TABLE `pagamentos` ADD `scheduleCronTaskUid` varchar(65);--> statement-breakpoint
ALTER TABLE `orcamentos` ADD CONSTRAINT `orcamentos_scheduleCronTaskUid_unique` UNIQUE(`scheduleCronTaskUid`);--> statement-breakpoint
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_scheduleCronTaskUid_unique` UNIQUE(`scheduleCronTaskUid`);