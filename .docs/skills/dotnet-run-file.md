
Enables you to write, execute, and manage standalone C# scripts (`.cs` files) without generating `.csproj` files or standard project scaffolding. Use this skill for rapid prototyping, one-off automation, data exploration, and API testing.

## Prerequisites

- **Environment:** .NET 10 SDK (or later) must be installed on the host system.
- **Execution Engine:** The CLI command `dotnet run <filename>.cs`.

## Core Rules & Code Structure

When generating single-file C# scripts, the agent MUST adhere strictly to the following rules:

1.  **Top-Level Statements Only:** Do not wrap code in `namespace` or `class Program { static void Main() }`. Write executable code directly at the root of the file.
2.  **Type Declarations at the Bottom:** Any custom `class`, `record`, `struct`, or `interface` MUST be declared _after_ all executable top-level code.
3.  **Single File Limit:** Do not attempt to split logic across multiple `.cs` files. The execution command targets exactly one file.
4.  **Implicit Variables:** Use the implicitly available `args` string array to access CLI arguments.

## C# Script Directives Reference

Use special directives (`#:`) at the very top of the `.cs` file to replicate `.csproj` functionality. Do not use legacy `dotnet-script` directives (e.g., `#r "nuget:"`).

| Capability           | Directive Syntax                  | Example                                                            |
| :------------------- | :-------------------------------- | :----------------------------------------------------------------- |
| **NuGet Packages**   | `#:package <PackageId>@<Version>` | `#:package Newtonsoft.Json@13.0.3`                                 |
| **Change SDK**       | `#:sdk <SdkString>`               | `#:sdk Microsoft.NET.Sdk.Web`                                      |
| **Build Properties** | `#:property <Key> <Value>`        | `#:property LangVersion preview` <br> `#:property Nullable enable` |
| **Local Projects**   | `#:project <Path>`                | `#:project ../MyLib/MyLib.csproj`                                  |

## Standard Workflows & Templates

### 1. Basic CLI Automation / Scripting

**Use Case:** Run a quick utility script with a NuGet dependency.
**File:** `script.cs`

```csharp
#:package Humanizer@2.14.1
#:property Nullable enable

using Humanizer;

var targetDate = DateTimeOffset.Parse("2025-11-10");
var duration = DateTimeOffset.Now - targetDate;
Console.WriteLine($"It has been {duration.Humanize()}.");
```

### 2. Standalone Minimal Web API

**Use Case:** Spin up an ASP.NET Core API for rapid testing or mocking.
**File:** `api.cs`

```csharp
#:sdk Microsoft.NET.Sdk.Web

var app = WebApplication.CreateBuilder(args).Build();

app.MapGet("/", () => "Hello from a single-file API!");
app.MapGet("/users/{id}", (int id) => new User(id, $"User{id}"));

app.Run();

// Types must go at the bottom
record User(int Id, string Name);
```

### 3. Unix Executable Script (Linux/macOS only)

**Use Case:** Create a script that acts like a native Bash/Python script.
**File:** `task.cs`

```csharp
#!/usr/bin/env dotnet run
Console.WriteLine("Executing as a native shell script.");
```

_Agent Action:_ When generating this on Unix systems, instruct the user to run `chmod +x task.cs` before executing `./task.cs`.

## CLI Execution & Lifecycle Commands

When instructing the system or user on how to run or manage the scripts, use the following commands:

- **Execute the script:**
  `dotnet run script.cs`
- **Execute the script and pass arguments:** (Use `--` to separate dotnet args from script args)
  `dotnet run script.cs -- arg1 arg2`
- **Convert to a full .NET project:** (Used when the script grows too complex or requires multiple files)
  `dotnet project convert script.cs`

## Guardrails and Exclusions

- **Do not use `dotnet build` or `dotnet publish`** directly on a `.cs` file. Single-file execution is for `dotnet run` only.
- **Do not recommend this for production deployments.** Instruct the user to convert to a full project (`dotnet project convert`) if CI/CD or production hosting is required.
- **Do not use XML configuration.** All project-level configurations must be handled via `#:` directives at the top of the file.
