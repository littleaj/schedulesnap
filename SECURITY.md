# Security Policy

## Supported Versions

Security fixes are generally made against the latest version of the project.

| Version | Supported |
| --- | --- |
| Latest release | Yes |
| Older releases | No guarantee of security updates |
| Development branch | Best effort |

If you maintain additional supported release branches, update this table accordingly.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

To report a vulnerability, use one of the following methods:

- **Preferred:** Submit a private vulnerability report through GitHub's private vulnerability reporting feature, if enabled for this repository.
- **Alternative:** Contact the maintainer privately at [security contact email](mailto:schedulesnap@googlegroups.com).

Please include as much of the following information as you can:

- A description of the vulnerability and its potential impact.
- The affected version, branch, or commit.
- Steps to reproduce the issue, including a proof of concept where appropriate.
- Any relevant logs, screenshots, or error messages.
- Possible mitigations or suggested fixes, if known.

Please avoid including real user data, credentials, access tokens, or other sensitive information in your report.

## What to Expect

I will make a reasonable effort to:

1. Acknowledge receipt of your report.
2. Investigate and assess the reported issue.
3. Communicate with you about the findings and any planned remediation.
4. Coordinate disclosure when appropriate.

Response and remediation times depend on the severity and complexity of the issue, as well as maintainer availability. No fixed response or resolution time is guaranteed.

If the report is accepted, the issue may be addressed through a patch release, a source-code update, or another appropriate mitigation.

## Scope

Security reports are welcome for vulnerabilities in the project itself, including issues that could affect:

- Authentication or authorization.
- Exposure of sensitive information.
- Injection vulnerabilities.
- Cross-site scripting (XSS) or cross-site request forgery (CSRF).
- Insecure configuration or access controls.
- Dependencies or build processes that introduce exploitable vulnerabilities.

Please report vulnerabilities in supported versions of the project. Reports involving third-party services should be directed to their respective maintainers when the issue is outside this project's control.

## Disclosure

Please allow the maintainer a reasonable opportunity to investigate and address a confirmed vulnerability before publicly disclosing technical details that could enable exploitation.

The maintainer may coordinate a public security advisory or release when appropriate. There is no guarantee that a report will result in a security advisory, a fix, or a CVE assignment.

Thank you for helping keep this project and its users secure.
