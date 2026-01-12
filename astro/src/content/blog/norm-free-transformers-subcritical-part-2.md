---
title: "Normalization-free transformers are subcritical. Part 2."
date: 2026-01-12
description: "Part 2 (draft/unlisted)."
unlisted: true
---

<!--
This post is intentionally marked `unlisted: true` so it does not appear on /blog/,
but it is still generated and reachable by direct URL: /blog/norm-free-transformers-subcritical-part-2/

Starting point: copied from `norm-free-transformers-subcritical.md`.
-->

## Overview

In my previous blog post, I demonstrated empirically that normalization-free (DyT/Derf) transformers [] have worse gradient propagation properties than the standard pre-LN transformer—namely, they exhibit much stronger gradient amplification (approximately stretched-exponential, as opposed to the power-law growth in the pre-LN baseline). Although the theoretical analysis correctly characterized the gap between the models at a qualitative level, it did not account for the attention mechanism.

In this blog post, I modify the theoretical argument by reintroducing attention, using the theoretical framework developed in [], which restricts the initial token configurations to permutation-invariant ones. We generalize the analysis in [] to normalization-free transformers by replacing the LayerNorms with point-wise activation functions. We show that attention does not change the mechanism that makes gradient propagation in normalization-free transformers inferior to that in pre-LN transformers. However, we can now demonstrate not only qualitative agreement between theoretical and empirical activation norms, gradients, and Jacobians, but also perfect quantitative agreement.

## Background

For a general introduction to the theory of signal propagation and the mean-field formalism in the large-width limit at initialization, I refer the reader to my previous blog post.

[] observed that, for permutation-equivariant transformers (i.e., with bidirectional attention and no positional encoding), the mean-field theory at initialization effectively reduces to the layer-to-layer evolution of just two degrees of freedom, provided the initial token configuration is permutation-invariant: the component variance of the activation vector at a given position, $q^l = \frac{1}{N_l} h^{l}_a \cdot h^{l}_b,\ a = b$, and the covariance between components of activation vectors at different positions, $p^l = \frac{1}{N_l} h^{l}_a \cdot h^{l}_b,\ a \ne b$. Here, $h^{l}_a$ is an $N_l$-dimensional activation vector at layer $l$ and position $a$. Geometrically, the former is the norm of the activation vector at a given position, normalized by $N_l$, while the latter is the normalized dot product between activation vectors at different positions.

Let us assume that the transformer has $L$ transformer blocks, each consisting of attention followed by MLP with ReLU nonlinearity. For simplicity, we assume single-head attention – in case of multi-head attention the equations remain *exactly* identical. The dynamics of activation vectors of hidden dimension $d$ is given by the following equation:
$$
\begin{equation}
h^{l+1}_a
=
h^{l}_a
+
\begin{cases}
W_O^{l} W_V^{l} \displaystyle\sum_{b} A^{l}_{ab}\,\tilde h^{l}_{b},
& l \text{ even (attn)},\\[6pt]
W_2^{l}\,\mathrm{ReLU}\!\bigl(W_1^{l}\tilde h^{l}_{a}\bigr),
& l \text{ odd (MLP)}.
\end{cases}
\end{equation}
$$
Note that here $l=\overline{0,\, 2L-1}$ enumerates layers (attention and MLP) rather than transformer blocks, which in this terminology consist of two layers. Here $\tilde h^l_a$ are normalized activation vectors via LayerNorm (in the next section, we will drop this normalization and replace it with the pointwise activation function $\text{Derf}$). The attention scores $A_{ab}^l$ between the $a$-th query and the $b$-th key are computed in the standard way:
$$
\begin{equation}
A_{ab}^l = \frac{e^{(W_Q^l h^l_a)\cdot(W_K^l h^l_b)/\sqrt{d}}}{\sum_c e^{(W_Q^l h^l_a)\cdot(W_K^l h^l_c)/\sqrt{d}}}.
\end{equation}
$$
**Init**!

With a number of simplifying assumptions about the statistics of attention scores (see Assumption 2 in []), one can solve for the dynamics of $q^l$ and $p^l$:
$$
\begin{equation}
\begin{split}
& q^{l+1}
=
q^{l}
+
\begin{cases}
(\sigma_{O}\sigma_{V})^{2}\,\tilde q^{l}\,
\dfrac{
1+\dfrac{\tilde p^{l}}{\tilde q^{l}}(n-1)\exp\!\bigl(\sigma_{QK}^{2}\tilde q^{l}(\tilde p^{l}-\tilde q^{l})\bigr)
}{
1+(n-1)\exp\!\bigl(\sigma_{QK}^{2}\tilde q^{l}(\tilde p^{l}-\tilde q^{l})\bigr)
},
& l \text{ even (attn)},\\[8pt]
\dfrac{1}{2}(\sigma_{W_2}\sigma_{W_1})^{2}\,\tilde q^{l},
& l \text{ odd (MLP)}.
\end{cases} \\
& p^{l+1}
=
p^{l}
+
\begin{cases}
(\sigma_{O}\sigma_{V})^{2}\,\tilde q^{l}\,
\dfrac{
1+\dfrac{\tilde p^{l}}{\tilde q^{l}}(n-1)\exp\!\bigl(\sigma_{QK}^{2}\tilde p^{l}(\tilde p^{l}-\tilde q^{l})\bigr)
}{
1+(n-1)\exp\!\bigl(\sigma_{QK}^{2}\tilde p^{l}(\tilde p^{l}-\tilde q^{l})\bigr)
},
& l \text{ even (attn)},\\[8pt]
(\sigma_{W_2}\sigma_{W_1})^{2}\,\kappa\left(\frac{\tilde p^{l}}{\tilde q^{l}}\right)\tilde q^{l},
& l \text{ odd (MLP)}.
\end{cases}


\end{split}
\end{equation}
$$

<span id="references"></span>
## References

<div id="refs"></div>


