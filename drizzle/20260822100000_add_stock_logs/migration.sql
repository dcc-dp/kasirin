CREATE TABLE `stock_logs` (
    `id` int AUTO_INCREMENT PRIMARY KEY,
    `product_id` int NOT NULL,
    `type` enum('in','out','adjustment') NOT NULL,
    `quantity` int NOT NULL,
    `stock_before` int NOT NULL,
    `stock_after` int NOT NULL,
    `reference_type` varchar(50),
    `reference_id` int,
    `description` longtext NOT NULL,
    `user_id` int,
    `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),

    CONSTRAINT `stock_logs_product_id_products_id_fkey`
        FOREIGN KEY (`product_id`)
        REFERENCES `products`(`id`),

    CONSTRAINT `stock_logs_user_id_users_id_fkey`
        FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`)
);
