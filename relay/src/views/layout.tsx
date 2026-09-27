import type { Child, FC } from "hono/jsx";

export const Layout: FC<{ title: string; children?: Child }> = ({
	title,
	children,
}) => (
	<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title>{title} · Yellowhammer</title>
			<link rel="stylesheet" href="/styles.css" />
		</head>
		<body class="min-h-screen bg-white text-gray-900">
			<main class="mx-auto max-w-xl px-4 py-12">
				<h1 class="text-2xl font-bold text-gray-900">Yellowhammer</h1>
				<div class="mt-8">{children}</div>
			</main>
		</body>
	</html>
);
