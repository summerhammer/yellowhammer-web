export const DocumentationOutline = () => (
	<aside className="yh-doc-outline" aria-label="Documentation status">
		<strong>Documentation outline</strong>
		<p>
			This page shows the planned structure and content briefs. Complete
			instructions and visuals will be added after product verification.
		</p>
	</aside>
);

export const VisualPlaceholder = ({ id, type, title, purpose, caption }) => (
	<figure
		className="yh-visual-placeholder"
		id={id}
		aria-labelledby={`${id}-caption`}
	>
		<div className="yh-visual-placeholder__label">Planned {type}</div>
		<strong className="yh-visual-placeholder__title">{title}</strong>
		<p className="yh-visual-placeholder__purpose">{purpose}</p>
		<figcaption id={`${id}-caption`}>{caption}</figcaption>
	</figure>
);
