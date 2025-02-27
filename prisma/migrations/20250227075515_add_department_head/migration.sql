-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "departmentHeadId" TEXT;

-- AlterTable
ALTER TABLE "FormSubmission" ADD COLUMN     "userEmail" TEXT,
ADD COLUMN     "userName" TEXT;

-- CreateTable
CREATE TABLE "FormView" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormView_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FormView" ADD CONSTRAINT "FormView_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
