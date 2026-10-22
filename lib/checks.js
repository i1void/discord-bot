/**
 * Role-hierarchy check for moderation commands.
 * Returns an error message, or null if ctx.member is allowed to act on target.
 */
export function hierarchyError(ctx, target) {
  if (target.id === ctx.author.id) return "You can't do that to yourself.";
  if (target.id === ctx.guild.ownerId) return "You can't do that to the server owner.";
  if (ctx.author.id === ctx.guild.ownerId) return null;

  if (ctx.member.roles.highest.position <= target.roles.highest.position) {
    return "Your highest role must be above theirs.";
  }
  return null;
}
