import { type FormEvent } from "react";
import { toast } from "sonner";

import { PublicHero } from "../../components/public/public-hero";
import { SCHOOL_PROFILE } from "../../data/seed";

export function PublicContactPage() {
  function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    toast.success("Inquiry prepared for the school office.", {
      description: "This prototype does not send messages outside the browser.",
    });
  }

  return (
    <>
      <PublicHero
        eyebrow="Contact us"
        title="School office"
        description="Reach the school for enrollment concerns, learner records, family coordination, and school activities."
        image="/assets/section-family.webp"
      />

      <section className="public-section public-contact-page">
        <div className="public-container public-contact-page__grid">
          <div className="public-contact-page__details">
            <p className="public-eyebrow">Contact information</p>
            <h2>We are here to help.</h2>
            <p className="public-section-lead">For urgent learner concerns, families should contact the class adviser or visit the school office during regular weekday hours.</p>
            <dl className="public-profile-list public-profile-list--wide">
              <div><dt>Address</dt><dd>{SCHOOL_PROFILE.address}</dd></div>
              <div><dt>Telephone</dt><dd>{SCHOOL_PROFILE.phone}</dd></div>
              <div><dt>Email</dt><dd>{SCHOOL_PROFILE.email}</dd></div>
              <div><dt>Office hours</dt><dd>Monday to Friday, 7:30 AM to 5:00 PM</dd></div>
            </dl>
            <img src="/assets/balili-classroom.webp" alt="A Balili Elementary School classroom" />
          </div>

          <form className="public-contact-form" onSubmit={submitInquiry}>
            <div><p className="public-eyebrow">Send an inquiry</p><h2>Message details</h2></div>
            <label><span>Full name</span><input name="name" placeholder="Parent or guardian name" required /></label>
            <div className="public-contact-form__row">
              <label><span>Email address</span><input name="email" type="email" placeholder="name@example.com" required /></label>
              <label><span>Contact number</span><input name="phone" type="tel" placeholder="09XX XXX XXXX" /></label>
            </div>
            <label>
              <span>Topic</span>
              <select name="topic" defaultValue="General inquiry">
                <option>General inquiry</option>
                <option>Enrollment</option>
                <option>Learner records</option>
                <option>Family concern</option>
                <option>School activity</option>
              </select>
            </label>
            <label><span>Message</span><textarea name="message" placeholder="How can the school help?" required /></label>
            <div className="public-contact-form__footer"><p>Prototype form. No information is transmitted.</p><button className="public-button public-button--dark" type="submit">Prepare Message</button></div>
          </form>
        </div>
      </section>
    </>
  );
}
