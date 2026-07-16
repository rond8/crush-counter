const CONTACT_EMAIL = 'rondosio8@gmail.com'
const EFFECTIVE_DATE = '2026-07-12'

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <div className="text-sm text-muted leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">Privacy Policy</h1>
        <p className="text-muted text-sm">Effective {EFFECTIVE_DATE}</p>
      </section>

      <div className="card p-6 space-y-6">
        <p className="text-sm text-muted leading-relaxed">
          This privacy policy applies to the Crush Counter app for mobile devices and web
          browsers, together with any related services operated by Ron David M. Osio
          (collectively, the "Application"). Ron David M. Osio is hereby referred to as
          the "Service Provider".
        </p>

        <Section title="Information Collection and Use">
          <p>The Application collects information when you download and use it. This information may include:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Your device's Internet Protocol address</li>
            <li>The pages of the Application that you visit, the time and date of your visit, the time spent on those pages</li>
            <li>The time spent on the Application</li>
            <li>The operating system you use</li>
          </ul>
        </Section>

        <Section title="Cookies and Tracking Technologies">
          <p>
            The Application or its third-party SDKs may use cookies, SDKs, pixels, and similar
            technologies to support functionality, analytics, or service delivery. Where
            required by applicable law, the Service Provider will obtain consent before using
            non-essential tracking technologies.
          </p>
        </Section>

        <Section title="Your Rights">
          <p>
            You may request access to, correction of, or deletion of your personal data held
            by the Service Provider. To exercise these rights, or to withdraw consent where
            processing is based on consent, contact the Service Provider at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-heart-purple hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="Your California Privacy Rights (CCPA/CPRA)">
          <p>
            If you are a California resident, you have the right to know what personal
            information is collected, the right to delete personal information, the right to
            opt out of the sale or sharing of personal information, and the right to
            non-discrimination for exercising these rights. To exercise your CCPA/CPRA rights,
            contact the Service Provider at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-heart-purple hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
          <p>
            The Service Provider may use the information you provide to send important
            information, required notices, and, where permitted by law, marketing
            communications.
          </p>
          <p>
            For a better experience while using the Application, the Service Provider may
            require you to provide certain personally identifiable information, including but
            not limited to email and age. The information the Service Provider requests will
            be retained and used as described in this privacy policy.
          </p>
        </Section>

        <Section title="Third Party Access">
          <p>
            Only aggregated, anonymized data is periodically transmitted to external services
            to aid the Service Provider in improving the Application and their service. The
            Service Provider may share your information with third parties in the ways that
            are described in this privacy statement.
          </p>
        </Section>

        <Section title="International Data Transfers">
          <p>
            The Service Provider or its third-party service providers may transfer personal
            data to countries outside your country of residence, including outside the
            European Economic Area (EEA). Where applicable law requires safeguards for
            international transfers, the Service Provider will use appropriate mechanisms:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
            <li>Adequacy decisions or other legally recognized transfer mechanisms</li>
            <li>Your consent, where required and legally permitted</li>
          </ul>
          <p>
            Data protection laws in other countries may differ from those in your
            jurisdiction. Where required by law, the Service Provider will apply appropriate
            safeguards and obtain any consent required for the transfer.
          </p>
          <p>The Service Provider may disclose User Provided and Automatically Collected Information:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>as required by law, such as to comply with a subpoena, or similar legal process;</li>
            <li>
              when they believe in good faith that disclosure is necessary to protect their
              rights, protect your safety or the safety of others, investigate fraud, or
              respond to a government request;
            </li>
            <li>
              with their trusted service providers who work on their behalf, do not have an
              independent use of the information the Service Provider discloses to them, and
              have agreed to adhere to the rules set forth in this privacy statement.
            </li>
          </ul>
        </Section>

        <Section title="Opt-Out Rights">
          <p>
            You can stop further collection of information from your mobile device or computer
            by uninstalling the Application. Uninstalling will stop the Application from
            collecting data from your device, but it does not automatically delete information
            that has already been transmitted to the Service Provider or to third parties.
          </p>
          <p>
            You can stop further collection of information from your device by ceasing to use
            the website. Ceasing to use will stop the website from collecting data from your
            device, but it does not automatically delete information that has already been
            transmitted to the Service Provider or to third parties.
          </p>
          <p>
            To request deletion of your personal data, to withdraw consent, or to exercise any
            of your rights, contact the Service Provider at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-heart-purple hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="Data Retention Policy">
          <p>The Service Provider retains personal data based on its necessity for the stated purposes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>User Provided Data: retained for the duration of your use of the Application plus 12 months thereafter, unless longer retention is required by law</li>
            <li>Automatically Collected Data: retained for up to 24 months from collection, unless longer retention is required for legal compliance</li>
            <li>Aggregated and Anonymized Data: retained indefinitely as it no longer identifies you</li>
            <li>Data required for legal compliance: retained as long as required by applicable law</li>
          </ul>
          <p>
            You may request deletion of your personal data, subject to any legal obligation to
            retain it. If you want the Service Provider to delete User Provided Data submitted
            through the Application, please contact them at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-heart-purple hover:underline">
              {CONTACT_EMAIL}
            </a>
            . Please note that some User Provided Data may be required for the Application to
            function properly.
          </p>
        </Section>

        <Section title="Data Deletion">
          <p>
            You can request deletion of your personal data or account by contacting the
            Service Provider at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-heart-purple hover:underline">
              {CONTACT_EMAIL}
            </a>
            . The Service Provider will process your request within the timeframes required by
            applicable law.
          </p>
          <p>
            Upon verification of your identity, the Service Provider will delete your personal
            data from its systems, except where retention is required for legal compliance or
            legitimate business purposes.
          </p>
        </Section>

        <Section title="Children">
          <p>
            The Application is not intended for children under 18 years of age, or such higher
            age as required by applicable law. The Service Provider does not knowingly solicit
            data from children or market the Application to them.
          </p>
          <p>
            The Service Provider does not knowingly collect personally identifiable information
            from children. The Service Provider encourages all children to never submit any
            personally identifiable information through the Application and/or Services. The
            Service Provider encourages parents and legal guardians to monitor their children's
            Internet usage and to help enforce this Policy by instructing their children never
            to provide personally identifiable information through the Application and/or
            Services without their permission. If you have reason to believe that a child has
            provided personally identifiable information to the Service Provider through the
            Application and/or Services, please contact the Service Provider so that they will
            be able to take the necessary actions. If you are under 18 years of age, your
            parent or guardian must provide consent on your behalf where permitted by law.
          </p>
        </Section>

        <Section title="Security">
          <p>
            The Service Provider is concerned about safeguarding the confidentiality of your
            information. The Service Provider provides physical, electronic, and procedural
            safeguards to protect information the Service Provider processes and maintains.
          </p>
        </Section>

        <Section title="Data Breach Notification">
          <p>
            If a data breach occurs that affects your personal data, the Service Provider will
            notify you in accordance with applicable legal requirements, including, where
            required, providing information about the nature of the breach and the steps being
            taken to address it.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            The Service Provider may update this Privacy Policy from time to time. The Service
            Provider will notify you of material changes by posting the updated Privacy Policy
            with an effective date. Where required by law, the Service Provider will seek your
            consent to material changes before they take effect.
          </p>
          <p>
            Previous versions of this Privacy Policy will be maintained and made available upon
            request by contacting the Service Provider at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-heart-purple hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="Your Consent">
          <p>
            Where processing is based on consent, you provide that consent by affirmatively
            opting in to the relevant feature or action. You may withdraw consent at any time
            without affecting processing carried out before withdrawal. Processing based on
            other lawful bases is carried out as described above.
          </p>
        </Section>

        <Section title="Contact Us">
          <p>
            If you have any questions regarding privacy while using the Application, or have
            questions about the practices, please contact the Service Provider via email at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-heart-purple hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  )
}
