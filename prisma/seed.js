import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker"; // Sử dụng faker với ngôn ngữ tiếng Việt
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Bắt đầu quá trình seed...");

  // 1. Xóa dữ liệu cũ
  console.log("Xóa dữ liệu cũ...");
  await prisma.application.deleteMany();
  await prisma.jobSkill.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.companyReview.deleteMany();
  await prisma.company_VipPackage.deleteMany();
  await prisma.job.deleteMany();
  // Xóa User và Company TRƯỚC Account vì chúng có khóa ngoại đến Account
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.account.deleteMany();
  // Các bảng còn lại
  await prisma.skill.deleteMany();
  await prisma.vipPackage.deleteMany();
  await prisma.province.deleteMany();
  console.log("Đã xóa dữ liệu cũ.");

  // 2. Băm mật khẩu chung
  const hashedPassword = await bcrypt.hash("Abc@1234", 10);

  // 3. Tạo dữ liệu cho các bảng không có khóa ngoại
  console.log("Tạo Provinces, Skills, và VipPackages...");
  await prisma.province.createMany({
    data: [
      { name: "Hà Nội" },
      { name: "Hồ Chí Minh" },
      { name: "Đà Nẵng" },
      { name: "Hải Phòng" },
      { name: "Cần Thơ" },
    ],
  });
  await prisma.skill.createMany({
    data: [
      { name: "JavaScript" },
      { name: "TypeScript" },
      { name: "ReactJS" },
      { name: "NodeJS" },
      { name: "ExpressJS" },
      { name: "Python" },
      { name: "Django" },
      { name: "Java" },
      { name: "Spring Boot" },
      { name: "SQL" },
    ],
  });
  await prisma.vipPackage.createMany({
    data: [
      { name: "Gói Bạc", numPost: 5, price: 500000, durationDay: 30 },
      { name: "Gói Vàng", numPost: 15, price: 1200000, durationDay: 30 },
      { name: "Gói Bạch Kim", numPost: 50, price: 3000000, durationDay: 60 },
    ],
  });
  console.log("Đã tạo Provinces, Skills, và VipPackages.");

  const createdProvinces = await prisma.province.findMany();
  const createdSkills = await prisma.skill.findMany();

  // 4. Tạo tài khoản Admin
  console.log("Tạo tài khoản Admin...");
  await prisma.account.create({
    data: {
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Đã tạo tài khoản Admin.");

  // 5. Tạo Users và Companies cùng với tài khoản của họ
  console.log("Tạo Users và Companies...");
  // Tạo 10 Users
  for (let i = 0; i < 10; i++) {
    const email = faker.internet.email().toLowerCase();

    // SỬA LỖI: Bước 1 - Tạo Account trước
    const userAccount = await prisma.account.create({
      data: { email: email, password: hashedPassword, role: "USER" },
    });

    // SỬA LỖI: Bước 2 - Tạo User và liên kết bằng accountId
    await prisma.user.create({
      data: {
        email: email,
        username: faker.internet.username(),
        fullName: faker.person.fullName(),
        phone: faker.phone.number(),
        dob: faker.date.birthdate(),
        address: faker.location.streetAddress(),
        gender: faker.helpers.arrayElement(["MALE", "FEMALE", "OTHER"]),
        accountId: userAccount.id, // Liên kết tại đây
      },
    });
  }

  // Tạo 5 Companies
  for (let i = 0; i < 5; i++) {
    const email = faker.internet.email().toLowerCase();
    const companyName = faker.company.name();

    // SỬA LỖI: Bước 1 - Tạo Account trước
    const companyAccount = await prisma.account.create({
      data: { email: email, password: hashedPassword, role: "COMPANY" },
    });

    // SỬA LỖI: Bước 2 - Tạo Company và liên kết bằng accountId
    await prisma.company.create({
      data: {
        email: email,
        name: companyName,
        description: faker.company.catchPhrase(),
        address: faker.location.streetAddress(),
        website: `https://www.${companyName.replace(/\s+/g, "").toLowerCase()}.com`,
        logo: faker.image.url({
          width: 100,
          height: 100,
          category: "business",
        }),
        taxCode: faker.string.alphanumeric(10).toUpperCase(),
        businessLicensePath: "/licenses/default.pdf",
        isApproved: true,
        provinceId: faker.helpers.arrayElement(createdProvinces).id,
        accountId: companyAccount.id, // Liên kết tại đây
      },
    });
  }
  console.log("Đã tạo Users và Companies.");

  const createdUsers = await prisma.user.findMany();
  const createdCompanies = await prisma.company.findMany();

  // 6. Tạo Jobs
  console.log("Tạo Jobs...");
  const jobsToCreate = [];
  for (const company of createdCompanies) {
    for (let i = 0; i < 3; i++) {
      jobsToCreate.push({
        title: faker.person.jobTitle(),
        description: faker.lorem.paragraphs(),
        address: faker.location.secondaryAddress(),
        provinceId: faker.helpers.arrayElement(createdProvinces).id,
        jobType: faker.helpers.arrayElement([
          "FULL_TIME",
          "PART_TIME",
          "REMOTE",
        ]),
        numApplications: faker.number.int({ min: 5, max: 50 }),
        level: faker.helpers.arrayElement([
          "INTERN",
          "JUNIOR",
          "MID",
          "SENIOR",
        ]),
        salaryMin: faker.number.int({ min: 8, max: 15 }) * 1000000,
        salaryMax: faker.number.int({ min: 16, max: 50 }) * 1000000,
        endDate: faker.date.future(),
        companyId: company.id,
      });
    }
  }
  await prisma.job.createMany({ data: jobsToCreate });
  console.log("Đã tạo Jobs.");

  const createdJobs = await prisma.job.findMany();

  // 7. Tạo các bảng quan hệ (Many-to-Many)
  console.log("Tạo quan hệ User-Skill và Job-Skill...");
  const userSkillsToCreate = [];
  for (const user of createdUsers) {
    const skillsToAssign = faker.helpers.arrayElements(createdSkills, {
      min: 2,
      max: 5,
    });
    for (const skill of skillsToAssign) {
      userSkillsToCreate.push({ userId: user.id, skillId: skill.id });
    }
  }
  if (userSkillsToCreate.length > 0) {
    await prisma.userSkill.createMany({ data: userSkillsToCreate });
  }

  const jobSkillsToCreate = [];
  for (const job of createdJobs) {
    const skillsToAssign = faker.helpers.arrayElements(createdSkills, {
      min: 2,
      max: 5,
    });
    for (const skill of skillsToAssign) {
      jobSkillsToCreate.push({ jobId: job.id, skillId: skill.id });
    }
  }
  if (jobSkillsToCreate.length > 0) {
    await prisma.jobSkill.createMany({ data: jobSkillsToCreate });
  }
  console.log("Đã tạo quan hệ User-Skill và Job-Skill.");

  // 8. Tạo Applications
  console.log("Tạo Applications...");
  const applicationsToCreate = [];
  for (let i = 0; i < 20; i++) {
    const randomUser = faker.helpers.arrayElement(createdUsers);
    const randomJob = faker.helpers.arrayElement(createdJobs);
    applicationsToCreate.push({
      userId: randomUser.id,
      jobId: randomJob.id,
      coverLetter: faker.lorem.paragraph(),
      resumePath: `/resumes/${randomUser.username}_resume.pdf`,
      status: faker.helpers.arrayElement(["PENDING", "APPROVED", "REJECTED"]),
    });
  }

  const applicationMap = new Map();

  for (const app of applicationsToCreate) {
    const key = `${app.userId}-${app.jobId}`;
    if (!applicationMap.has(key)) {
      applicationMap.set(key, app);
    }
  }

  const uniqueApplications = Array.from(applicationMap.values()).filter(
    Boolean
  );

  if (uniqueApplications.length > 0) {
    await prisma.application.createMany({ data: uniqueApplications });
  }
  console.log("Đã tạo Applications.");

  console.log("Seed thành công!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
