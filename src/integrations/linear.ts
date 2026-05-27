import axios from 'axios';
import { Issue, Account } from '../types';

const LINEAR_API_URL = 'https://api.linear.app/graphql';

const ASSIGNED_ISSUES_QUERY = `
  query AssignedIssues {
    viewer {
      assignedIssues(filter: { state: { type: { nin: ["completed", "cancelled"] } } }) {
        nodes {
          id
          title
          url
          priority
          priorityLabel
          state {
            name
          }
          project {
            name
          }
          team {
            name
          }
          updatedAt
        }
      }
    }
  }
`;

async function fetchIssues(token: string, account: Account): Promise<Issue[]> {
  const response = await axios.post(
    LINEAR_API_URL,
    { query: ASSIGNED_ISSUES_QUERY },
    {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    }
  );

  const nodes = response.data?.data?.viewer?.assignedIssues?.nodes ?? [];

  return nodes.map((node: any): Issue => ({
    id: node.id,
    title: node.title,
    url: node.url,
    priority: node.priority ?? null,
    priorityLabel: node.priorityLabel ?? null,
    state: node.state?.name ?? 'Unknown',
    project: node.project?.name ?? null,
    team: node.team?.name ?? 'Unknown',
    account,
    updatedAt: node.updatedAt,
  }));
}

export async function getLinearIssues(): Promise<{ personal: Issue[]; work: Issue[] }> {
  const personalToken = process.env.LINEAR_PERSONAL_TOKEN;
  const workToken = process.env.LINEAR_WORK_TOKEN;

  if (!personalToken || !workToken) {
    throw new Error('LINEAR_PERSONAL_TOKEN and LINEAR_WORK_TOKEN must be set');
  }

  const [personal, work] = await Promise.all([
    fetchIssues(personalToken, 'personal'),
    fetchIssues(workToken, 'work'),
  ]);

  return { personal, work };
}
