# Packaging This as an Antigravity Plugin

## Install locations (no packaging required)

The simplest install is just copying the `3d-semantic-webpage/` folder (this SKILL.md + its `references/`) into one of Antigravity's recognized skill directories:

| Scope | Path | Notes |
|---|---|---|
| Project-local | `<repo-root>/.antigravity/skills/3d-semantic-webpage/` | Loads only for that project/workspace |
| Shared across all Antigravity tools | `~/.gemini/skills/3d-semantic-webpage/` | Global, available in IDE + CLI |
| Antigravity CLI only | `~/.gemini/antigravity-cli/skills/3d-semantic-webpage/` | CLI-scoped, not shared with IDE |

Antigravity reads the same `SKILL.md` format as Claude Code and Codex — no reformatting needed.

## Packaging as a marketplace plugin

For a marketplace-installable distribution (`/plugin install ...`-style flow) rather than manual copying, wrap the skill in plugin metadata. Claude Code and Codex both use a `.claude-plugin/` (or `.codex-plugin/`) manifest pair at the plugin root:

```
3d-semantic-webpage-plugin/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── skills/
│   └── 3d-semantic-webpage/
│       ├── SKILL.md
│       └── references/
│           ├── semantic-html.md
│           ├── threejs-3d.md
│           └── accessibility-seo.md
└── README.md
```

`plugin.json`:

```json
{
  "name": "3d-semantic-webpage",
  "version": "1.0.0",
  "description": "Build 3D (Three.js/WebGL) web pages with fully semantic, accessible, SEO-ready HTML.",
  "skills": ["skills/3d-semantic-webpage"]
}
```

`marketplace.json`:

```json
{
  "name": "3d-semantic-webpage-marketplace",
  "plugins": [
    {
      "name": "3d-semantic-webpage",
      "source": "./",
      "description": "3D + semantic web page builder skill"
    }
  ]
}
```

Install flow once published to a repo:

```
/plugin marketplace add <your-org>/3d-semantic-webpage-plugin
/plugin install 3d-semantic-webpage
```

For Antigravity specifically, marketplace-style plugin installation is newer and less standardized than the direct skill-folder approach above — the safest, most portable option today is the direct copy into `.antigravity/skills/` or `~/.gemini/skills/`, with the plugin manifest kept alongside for forward compatibility and for use with Claude Code/Codex marketplaces in the meantime.

## Keeping the skill fast to load

Community reports note that large skill libraries (1,000+ skills) can slow Antigravity's agent initialization, since it indexes every `SKILL.md`'s YAML frontmatter at startup. This is a single, narrowly-scoped skill, so it won't meaningfully contribute to that — but if bundling it alongside many others, prefer project-local `.antigravity/skills/` scoping over installing everything globally.
