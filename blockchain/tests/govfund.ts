import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { PublicKey, SystemProgram } from "@solana/web3.js";

describe("govfund", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Govfund as Program;
    const admin = provider.wallet;

    const projectId = "kathmandu-road-001";
    const projectName = "Kathmandu Ring Road Expansion";
    const province = "Bagmati";
    const district = "Kathmandu";
    const sector = "Road Construction";
    const contractor = "Nepal Infrastructure Ltd";
    const totalBudget = new anchor.BN(500_000_000); // 500M NPR (in paisa)
    const milestoneCount = 5;
    const estimatedCompletion = new anchor.BN(Math.floor(Date.now() / 1000) + 365 * 24 * 3600);

    let projectPda: PublicKey;
    let projectBump: number;

    before(async () => {
        [projectPda, projectBump] = PublicKey.findProgramAddressSync(
            [Buffer.from("project"), Buffer.from(projectId)],
            program.programId
        );
    });

    it("Creates a project", async () => {
        const tx = await program.methods
            .createProject(
                projectId,
                projectName,
                province,
                district,
                sector,
                contractor,
                totalBudget,
                milestoneCount,
                estimatedCompletion
            )
            .accounts({
                project: projectPda,
                admin: admin.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        console.log("Create project tx:", tx);

        const project = await program.account.project.fetch(projectPda);
        expect(project.projectId).to.equal(projectId);
        expect(project.name).to.equal(projectName);
        expect(project.province).to.equal(province);
        expect(project.totalBudget.toNumber()).to.equal(totalBudget.toNumber());
        expect(project.allocatedBudget.toNumber()).to.equal(0);
        expect(project.releasedAmount.toNumber()).to.equal(0);
        expect(project.milestoneCount).to.equal(milestoneCount);
        expect(project.milestonesCompleted).to.equal(0);
        console.log("✅ Project created successfully");
    });

    it("Allocates budget", async () => {
        const amount = new anchor.BN(200_000_000);

        const tx = await program.methods
            .allocateBudget(amount)
            .accounts({
                project: projectPda,
                admin: admin.publicKey,
            })
            .rpc();

        console.log("Allocate budget tx:", tx);

        const project = await program.account.project.fetch(projectPda);
        expect(project.allocatedBudget.toNumber()).to.equal(200_000_000);
        console.log("✅ Budget allocated successfully");
    });

    it("Fails to allocate more than total budget", async () => {
        const overAmount = new anchor.BN(400_000_000); // would be 600M total > 500M

        try {
            await program.methods
                .allocateBudget(overAmount)
                .accounts({
                    project: projectPda,
                    admin: admin.publicKey,
                })
                .rpc();
            expect.fail("Should have thrown error");
        } catch (err: any) {
            expect(err.toString()).to.contain("ExceedsBudget");
            console.log("✅ Over-allocation correctly prevented");
        }
    });

    it("Releases funds", async () => {
        const amount = new anchor.BN(50_000_000);

        const tx = await program.methods
            .releaseFunds(amount)
            .accounts({
                project: projectPda,
                admin: admin.publicKey,
            })
            .rpc();

        console.log("Release funds tx:", tx);

        const project = await program.account.project.fetch(projectPda);
        expect(project.releasedAmount.toNumber()).to.equal(50_000_000);
        console.log("✅ Funds released successfully");
    });

    it("Fails to release more than allocated", async () => {
        const overAmount = new anchor.BN(200_000_000); // would be 250M > 200M allocated

        try {
            await program.methods
                .releaseFunds(overAmount)
                .accounts({
                    project: projectPda,
                    admin: admin.publicKey,
                })
                .rpc();
            expect.fail("Should have thrown error");
        } catch (err: any) {
            expect(err.toString()).to.contain("ExceedsAllocated");
            console.log("✅ Over-release correctly prevented");
        }
    });

    it("Records a document", async () => {
        const project = await program.account.project.fetch(projectPda);
        const docIndex = project.documentCount;

        const [docPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("document"),
                projectPda.toBuffer(),
                new anchor.BN(docIndex).toArrayLike(Buffer, "le", 2),
            ],
            program.programId
        );

        const tx = await program.methods
            .recordDocument(
                "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
                "Project Blueprint v1"
            )
            .accounts({
                document: docPda,
                project: projectPda,
                admin: admin.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        console.log("Record document tx:", tx);

        const doc = await program.account.documentRecord.fetch(docPda);
        expect(doc.ipfsHash).to.equal("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco");
        expect(doc.documentName).to.equal("Project Blueprint v1");
        console.log("✅ Document recorded successfully");
    });

    it("Updates a milestone", async () => {
        const milestoneIndex = 0;

        const [milestonePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("milestone"), projectPda.toBuffer(), Buffer.from([milestoneIndex])],
            program.programId
        );

        const tx = await program.methods
            .updateMilestoneStatus(
                milestoneIndex,
                "Foundation and drainage system",
                { completed: {} }
            )
            .accounts({
                milestone: milestonePda,
                project: projectPda,
                admin: admin.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        console.log("Update milestone tx:", tx);

        const milestone = await program.account.milestone.fetch(milestonePda);
        expect(milestone.description).to.equal("Foundation and drainage system");
        expect(JSON.stringify(milestone.status)).to.contain("completed");

        const project = await program.account.project.fetch(projectPda);
        expect(project.milestonesCompleted).to.equal(1);
        console.log("✅ Milestone updated successfully");
    });

    it("Closes a project", async () => {
        const tx = await program.methods
            .closeProject()
            .accounts({
                project: projectPda,
                admin: admin.publicKey,
            })
            .rpc();

        console.log("Close project tx:", tx);

        const project = await program.account.project.fetch(projectPda);
        expect(JSON.stringify(project.status)).to.contain("completed");
        console.log("✅ Project closed successfully");
    });

    it("Fails to modify closed project", async () => {
        try {
            await program.methods
                .allocateBudget(new anchor.BN(10_000))
                .accounts({
                    project: projectPda,
                    admin: admin.publicKey,
                })
                .rpc();
            expect.fail("Should have thrown error");
        } catch (err: any) {
            expect(err.toString()).to.contain("ProjectNotActive");
            console.log("✅ Closed project correctly prevents mutations");
        }
    });
});
