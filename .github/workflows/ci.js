module.exports = async ({github, context, core, exec}) => {
  const release = (await github.rest.repos.listReleases({
    owner: context.repo.owner,
    repo:  context.repo.repo,
  })).data.find(r => r.name === 'cache');

  const image = require('fs').readFileSync('Dockerfile').toString().match(/^FROM +([^ \n]+)/)[1];
  const cache = JSON.stringify({
    [image]: (await exec.getExecOutput('sh', ['-c', `docker inspect -f {{.Id}} $(docker pull -q ${image})`])).stdout.trim(),
  });

  github.rest.repos.updateRelease({
    owner:      context.repo.owner,
    repo:       context.repo.repo,
    release_id: release.id,
    body:       cache,
  });

  core.setOutput('no-cache', Boolean(release.body !== cache || (context.payload.inputs && context.payload.inputs['no-cache'])));
  core.setOutput('tags',     context.repo.owner.replace('dockerhub-', '') + '/' + context.repo.repo + ':' + context.ref.replace(/.+\//, ''));
};
