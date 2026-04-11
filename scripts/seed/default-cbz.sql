BEGIN;

INSERT INTO tenants (
    "Id",
    "Name",
    "Domain",
    "LogoUrl",
    "CreatedAtUtc"
)
VALUES (
    '019d7c38-2493-7dc5-9471-96add29a5a12',
    'CBZ',
    'cbz.co.zw',
    'https://i.ibb.co/LDmFSZYc/cbz-logo-high.webp',
    NOW()
)
ON CONFLICT ("Id") DO UPDATE
SET
    "Name" = EXCLUDED."Name",
    "Domain" = EXCLUDED."Domain",
    "LogoUrl" = EXCLUDED."LogoUrl";

INSERT INTO users (
    "Id",
    "TenantId",
    "Email",
    "WorkOsUserId",
    "FirstName",
    "LastName",
    "CreatedAtUtc"
)
VALUES (
    '3b5304c2-06c0-4df6-a757-bec2f90bbf76',
    '019d7c38-2493-7dc5-9471-96add29a5a12',
    'manasseh@cbz.co.zw',
    'seed-cbz-manasseh',
    'Manasseh',
    'Changachirere',
    NOW()
)
ON CONFLICT ("Id") DO UPDATE
SET
    "TenantId" = EXCLUDED."TenantId",
    "Email" = EXCLUDED."Email",
    "WorkOsUserId" = EXCLUDED."WorkOsUserId",
    "FirstName" = EXCLUDED."FirstName",
    "LastName" = EXCLUDED."LastName";

INSERT INTO agents (
    "Id",
    "TenantId",
    "DisplayName",
    "Description",
    "AvatarUrl",
    "AssignedPhoneNumber",
    "Provider",
    "ProviderAgentId",
    "IsActive",
    "CreatedAt"
)
VALUES
(
    '820ea8ee-f0b5-44fe-b124-ef1d88cbaece',
    '019d7c38-2493-7dc5-9471-96add29a5a12',
    'Tatenda',
    'CBZ customer service inbound agent for call center inquiry scenarios.',
    '',
    '+263000000001',
    0,
    'agent_7601kkxbstvzehkbvx459n2etxep',
    TRUE,
    NOW()
),
(
    'ec641859-91a7-4d98-99cb-73c347286d84',
    '019d7c38-2493-7dc5-9471-96add29a5a12',
    'Nomsa',
    'CBZ product marketing outbound agent for Smart Saver customer outreach.',
    '',
    '+263000000002',
    0,
    'agent_3401knf4am6ke9f8ce2k1zttd9gs',
    TRUE,
    NOW()
)
ON CONFLICT ("Id") DO UPDATE
SET
    "TenantId" = EXCLUDED."TenantId",
    "DisplayName" = EXCLUDED."DisplayName",
    "Description" = EXCLUDED."Description",
    "AvatarUrl" = EXCLUDED."AvatarUrl",
    "AssignedPhoneNumber" = EXCLUDED."AssignedPhoneNumber",
    "Provider" = EXCLUDED."Provider",
    "ProviderAgentId" = EXCLUDED."ProviderAgentId",
    "IsActive" = EXCLUDED."IsActive";

COMMIT;