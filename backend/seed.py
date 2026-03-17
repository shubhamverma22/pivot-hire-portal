"""
Seed script: python seed.py
Creates tables + demo data. Password for all users: password123
"""
import asyncio
from database import init_db, async_session
from models import *
from auth import hash_password

PASSWORD = "password123"


async def seed():
    await init_db()
    async with async_session() as db:
        # ── Founders ───────────────────────────────────────────────────────
        founder1 = User(
            email="alex@example.com", hashed_password=hash_password(PASSWORD),
            full_name="Alex Rivera", role=UserRole.FOUNDER, auth_provider="email",
        )
        founder2 = User(
            email="priya@example.com", hashed_password=hash_password(PASSWORD),
            full_name="Priya Sharma", role=UserRole.FOUNDER, auth_provider="email",
        )
        founder3 = User(
            email="james@example.com", hashed_password=hash_password(PASSWORD),
            full_name="James Chen", role=UserRole.FOUNDER, auth_provider="email",
        )
        db.add_all([founder1, founder2, founder3])
        await db.flush()

        # Founder profiles
        db.add(FounderProfile(
            user_id=founder1.id, location="Austin, TX", bio="Ex-founder of a fintech startup. Pivoting to product roles.",
            startup_name="PayFlow", startup_role="CEO & Co-founder", startup_duration="2020-2023",
            startup_description="Built a B2B payment processing platform serving 500+ SMBs.",
            linkedin_url="https://linkedin.com/in/alexrivera", skills="Python,React,Product Management,Fintech",
            experience_years=6, desired_roles="Product Manager,Engineering Lead", is_profile_complete=True,
        ))
        db.add(FounderProfile(
            user_id=founder2.id, location="Mumbai, India", bio="Built and sold a SaaS analytics tool. Now exploring DevOps roles.",
            startup_name="DataPulse", startup_role="CTO & Co-founder", startup_duration="2019-2024",
            startup_description="Real-time analytics dashboard for e-commerce. Acquired by Acme Corp.",
            linkedin_url="https://linkedin.com/in/priyasharma", resume_url="https://example.com/resume.pdf",
            skills="Kubernetes,AWS,Python,Go,CI/CD,Terraform", experience_years=8,
            desired_roles="DevOps Lead,Platform Engineer", is_profile_complete=True,
        ))
        db.add(FounderProfile(
            user_id=founder3.id, location="San Francisco, CA", bio="Serial entrepreneur. 2x founder in edtech.",
            startup_name="LearnLoop", startup_role="Founder", startup_duration="2021-2024",
            startup_description="AI-powered tutoring platform with 10K+ student users.",
            linkedin_url="https://linkedin.com/in/jameschen", skills="Machine Learning,Python,React,Growth,Strategy",
            experience_years=10, desired_roles="VP Engineering,CTO,Head of AI", is_profile_complete=True,
        ))

        # Subscriptions
        db.add(Subscription(user_id=founder1.id, plan=SubscriptionPlan.FREE, applications_used_this_month=2))
        db.add(Subscription(user_id=founder2.id, plan=SubscriptionPlan.PREMIUM))
        db.add(Subscription(user_id=founder3.id, plan=SubscriptionPlan.FREE, applications_used_this_month=4))

        # ── Companies ──────────────────────────────────────────────────────
        company1 = User(
            email="hire@acme.com", hashed_password=hash_password(PASSWORD),
            full_name="Sarah Lin", role=UserRole.COMPANY, auth_provider="email",
        )
        company2 = User(
            email="hr@globex.com", hashed_password=hash_password(PASSWORD),
            full_name="Marcus Johnson", role=UserRole.COMPANY, auth_provider="email",
        )
        db.add_all([company1, company2])
        await db.flush()

        db.add(CompanyProfile(
            user_id=company1.id, company_name="Acme Corp",
            website="https://acme.com", industry="Technology",
            company_size="200-500", location="San Francisco, CA",
            description="Leading enterprise SaaS platform helping businesses streamline operations.",
        ))
        db.add(CompanyProfile(
            user_id=company2.id, company_name="Globex Industries",
            website="https://globex.com", industry="Supply Chain / Logistics",
            company_size="50-200", location="New York, NY",
            description="Modern supply chain technology for the next generation of logistics.",
        ))
        await db.flush()

        # ── Jobs ───────────────────────────────────────────────────────────
        jobs_data = [
            Job(company_user_id=company1.id, title="Senior Product Manager", role_type=JobType.FULL_TIME,
                location="San Francisco, CA", salary_min=160000, salary_max=210000,
                description="Lead product strategy for our core platform. We're looking for ex-founders who understand building from 0 to 1.",
                requirements="5+ years PM experience\nFounder or early-stage startup experience preferred\nStrong technical background",
                skills_required="Product Management,Strategy,Analytics,SQL"),
            Job(company_user_id=company1.id, title="DevOps Lead", role_type=JobType.REMOTE,
                location="Remote (US)", salary_min=150000, salary_max=195000,
                description="Build and scale our cloud infrastructure. Own the CI/CD pipeline, monitoring, and incident response.",
                requirements="3+ years DevOps lead experience\nKubernetes, Terraform, AWS\nIncident management experience",
                skills_required="Kubernetes,AWS,Terraform,Docker,CI/CD"),
            Job(company_user_id=company1.id, title="Engineering Manager", role_type=JobType.FULL_TIME,
                location="San Francisco, CA", salary_min=180000, salary_max=240000,
                description="Lead a team of 8 engineers building our analytics platform. Founder mindset is a huge plus.",
                requirements="7+ years engineering experience\n2+ years people management\nExperience scaling teams",
                skills_required="Python,React,Team Leadership,Architecture"),
            Job(company_user_id=company2.id, title="Backend Engineer — Python", role_type=JobType.FULL_TIME,
                location="New York, NY", salary_min=140000, salary_max=185000,
                description="Build the APIs powering our supply chain platform. FastAPI, PostgreSQL, Redis in a high-throughput environment.",
                requirements="3+ years Python backend\nFastAPI or Django REST\nPostgreSQL & Redis",
                skills_required="Python,FastAPI,PostgreSQL,Redis"),
            Job(company_user_id=company2.id, title="Head of Growth", role_type=JobType.FULL_TIME,
                location="New York, NY", salary_min=170000, salary_max=220000,
                description="Own the growth strategy and execution. Perfect for an ex-founder who's scaled user acquisition before.",
                requirements="Proven track record of scaling growth\nData-driven mindset\nB2B SaaS experience",
                skills_required="Growth,Marketing,Analytics,Strategy"),
            Job(company_user_id=company2.id, title="Data Analyst Intern", role_type=JobType.INTERNSHIP,
                location="Remote", salary_min=25, salary_max=35,
                description="Join our data team for a 3-month internship. Great for aspiring analysts looking to break into tech.",
                requirements="Currently enrolled in relevant program\nSQL knowledge\nPython basics",
                skills_required="SQL,Python,Analytics"),
        ]
        db.add_all(jobs_data)
        await db.flush()

        # ── Applications ───────────────────────────────────────────────────
        apps = [
            Application(candidate_id=founder1.id, job_id=jobs_data[0].id,
                cover_letter="As a fintech founder, I deeply understand product-market fit. Excited about this PM role!",
                status=ApplicationStatus.SHORTLISTED),
            Application(candidate_id=founder1.id, job_id=jobs_data[3].id,
                cover_letter="I built the entire backend for PayFlow and would love to do the same at Globex.",
                status=ApplicationStatus.APPLIED),
            Application(candidate_id=founder2.id, job_id=jobs_data[1].id,
                cover_letter="Managed K8s clusters serving 10M+ requests/day at DataPulse. DevOps is my passion!",
                status=ApplicationStatus.VIEWED),
            Application(candidate_id=founder2.id, job_id=jobs_data[2].id,
                cover_letter="Led a team of 12 engineers at DataPulse. Ready for the next challenge.",
                status=ApplicationStatus.SHORTLISTED),
            Application(candidate_id=founder3.id, job_id=jobs_data[4].id,
                cover_letter="Grew LearnLoop to 10K users with $0 marketing budget. Growth is what I do.",
                status=ApplicationStatus.APPLIED),
        ]
        db.add_all(apps)
        await db.commit()

        print("✅  PivotHire seed complete!")
        print(f"   Founders: alex@example.com, priya@example.com, james@example.com")
        print(f"   Companies: hire@acme.com, hr@globex.com")
        print(f"   Password for all: {PASSWORD}")
        print(f"   {len(jobs_data)} jobs, {len(apps)} applications")


if __name__ == "__main__":
    asyncio.run(seed())
