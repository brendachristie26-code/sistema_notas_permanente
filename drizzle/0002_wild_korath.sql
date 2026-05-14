CREATE TABLE `configuracoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomeEmpresa` varchar(255) NOT NULL,
	`logoUrl` varchar(512),
	`logoKey` varchar(512),
	`cnpj` varchar(20),
	`endereco` text,
	`telefone` varchar(20),
	`email` varchar(320),
	`website` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `configuracoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orcamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numero` varchar(100) NOT NULL,
	`agenteId` int NOT NULL,
	`produtoId` int NOT NULL,
	`quantidade` int NOT NULL DEFAULT 1,
	`valorUnitario` int NOT NULL,
	`valorTotal` int NOT NULL,
	`dataEmissao` timestamp NOT NULL,
	`dataValidade` timestamp NOT NULL,
	`descricao` text,
	`status` enum('Rascunho','Enviado','Aceito','Rejeitado') NOT NULL DEFAULT 'Rascunho',
	`arquivoPdfUrl` varchar(512),
	`arquivoPdfKey` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orcamentos_id` PRIMARY KEY(`id`),
	CONSTRAINT `orcamentos_numero_unique` UNIQUE(`numero`)
);
