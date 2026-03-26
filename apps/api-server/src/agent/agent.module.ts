import { AuthModule } from '@/auth/auth.module'
import { IssueModule } from '@/issue/issue.module'
import { PropertyModule } from '@/property/property.module'
import { RealtimeModule } from '@/realtime/realtime.module'
import { UserModule } from '@/user/user.module'
import { Module } from '@nestjs/common'
import { AgentApprovalService } from './agent-approval.service'
import { AgentController } from './agent.controller'
import { AgentService } from './agent.service'
import { SandboxService } from './sandbox.service'

@Module({
  imports: [PropertyModule, IssueModule, AuthModule, UserModule, RealtimeModule],
  controllers: [AgentController],
  providers: [AgentService, AgentApprovalService, SandboxService],
})
export class AgentModule {}
