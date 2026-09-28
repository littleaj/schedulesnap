import React from 'react';
import { Link } from 'react-router';
import PageContent from '@/components/templates/PageContent';
import './TermsPage.css';

const TermsPage = () => {
	return (
		<PageContent className="terms-page">
			<section className="terms-page__header">
				<hgroup className="centered">
					<p className="eyebrow">Legal</p>
					<h1>Terms of Service</h1>
				</hgroup>
				<p className="centered">
					<strong>Effective date:</strong> <em>September 26, 2026</em>
				</p>
				<p className="intro">
					The following Terms of Service ("Terms") govern your use of
					ScheduleSnap. This page contains a short stub — the full Terms will be
					published here soon.
				</p>
			</section>

			<hr />

			<section aria-label="Terms stub">
				<h2>Overview (stub)</h2>
				<p>
					This is a placeholder for the full Terms of Service. It will describe
					permitted uses, user responsibilities, limitations of liability,
					termination, and other legal terms once finalized.
				</p>

				<h3>User obligations</h3>
				<p>Users must follow applicable laws and not misuse the service.</p>

				<h3>Account and access</h3>
				<p>
					Accounts are authenticated via Google. By using the service you
					authorize interactions with Google APIs as described in the Privacy
					Policy.
				</p>

				<h3>Limitation of liability (stub)</h3>
				<p>
					The final Terms will include typical disclaimers and limits of
					liability. For now, treat this page as informational only.
				</p>
			</section>

			<hr />

			<section aria-label="Contact">
				<h2>Contact</h2>
				<p>
					Questions about these Terms can be directed to:
				</p>
				<p className="centered">
					<strong>schedulesnap@googlegroups.com</strong>
				</p>
			</section>

			<aside className="terms-page__aside centered">
				<Link to="/help">Need help?</Link>
			</aside>
		</PageContent>
	);
};

export default TermsPage;
